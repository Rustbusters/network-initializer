use std::{fs, thread};
use log::{debug, error, info, warn};
use std::collections::HashMap;
use crossbeam_channel::{unbounded, Receiver, Sender};
use drone::RustBustersDrone;
use wg_2024::config::Config;
use wg_2024::controller::{DroneCommand, NodeEvent};
use wg_2024::drone::{Drone, DroneOptions};
use wg_2024::network::NodeId;
use wg_2024::packet::{NodeType, Packet};

fn main() {
    env_logger::init();

    // Vectors of thread initialized in this piece of code
    let mut handles = Vec::new();

    let mut drone_ids: Vec<NodeId> = Vec::new();
    let mut client_ids: Vec<NodeId> = Vec::new();
    let mut server_ids: Vec<NodeId> = Vec::new();

    let config_data = fs::read_to_string("input.toml").expect("Unable to read config file");
    let config: Config = toml::from_str(&config_data).expect("Unable to parse TOML");

    // TODO: Check if input is well parsed

    // Initialize crossbeam channels for internal communication
    let mut intra_node_channels: HashMap<NodeId, (Sender<Packet>, Receiver<Packet>)> = HashMap::new();
    let mut simulation_controller_channels: HashMap<NodeId, (Sender<DroneCommand>, Receiver<NodeEvent>)> = HashMap::new();

    // Crossbeam channels for each drone
    info!("Installing communication for nodes");
    for drone in &config.drone {
        let (sender, receiver) = unbounded();
        intra_node_channels.insert(drone.id, (sender, receiver));
        drone_ids.push(drone.id);
    }

    // Crossbeam channels for each client
    for client in &config.client {
        let (sender, receiver) = unbounded();
        intra_node_channels.insert(client.id, (sender, receiver));
        client_ids.push(client.id);
    }

    // Crossbeam channels for each server
    for server in &config.server {
        let (sender, receiver) = unbounded();
        intra_node_channels.insert(server.id, (sender, receiver));
        server_ids.push(server.id);
    }

    // Set up each drone
    info!("Creating and spawning Drones");
    for drone in config.drone {
        // Channels for communication between the drone and the simulation controller
        let (controller_to_drone_sender, drone_from_controller_receiver) = unbounded();
        let (drone_to_controller_sender, controller_from_drone_receiver) = unbounded();

        simulation_controller_channels.insert(drone.id, (controller_to_drone_sender, controller_from_drone_receiver));

        // Set the channels for the communication between the nodes
        let packet_recv = intra_node_channels.get(&drone.id).unwrap().1.clone();
        let mut packet_send = HashMap::new();

        for neighbour in drone.connected_node_ids {
            packet_send.insert(
                neighbour,
                intra_node_channels.get(&neighbour).unwrap().0.clone(),
            );
        }

        // Create and spawn a new node
        let drone_options = DroneOptions {
            id: drone.id,
            controller_send: drone_to_controller_sender,
            controller_recv: drone_from_controller_receiver,
            packet_recv,
            packet_send,
            pdr: drone.pdr,
        };

        let handle = thread::spawn(move || {
            let mut drone = RustBustersDrone::new(drone_options);
            drone.run();
        });

        handles.push(handle);
    }

    // TODO: implement initialization for clients and servers
    info!("Creating and spawning Clients");
    for client in config.client {
        // TODO: update general host to client
        // Channels for communication between the client and the simulation controller
        let (controller_to_client_sender, client_from_controller_receiver) = unbounded();
        let (client_to_controller_sender, controller_from_client_receiver) = unbounded();

        simulation_controller_channels.insert(client.id, (controller_to_client_sender, controller_from_client_receiver));

        // Set the channels for the communication between the nodes
        let packet_recv = intra_node_channels.get(&client.id).unwrap().1.clone();
        let mut packet_send = HashMap::new();

        for neighbour in client.connected_drone_ids {
            packet_send.insert(
                neighbour,
                intra_node_channels.get(&neighbour).unwrap().0.clone(),
            );
        }

        // Create and spawn new clients
        let handle = thread::spawn(move || {
            let mut client = node::SimpleHost::new(
                client.id,
                NodeType::Client,
                client_to_controller_sender,
                client_from_controller_receiver,
                packet_recv,
                packet_send
            );
            client.run();
        });
        handles.push(handle);
    }

    info!("Creating and spawning Servers");
    for server in config.server {
        let (controller_to_server_sender, server_from_controller_receiver) = unbounded();
        let (server_to_controller_sender, controller_from_server_receiver) = unbounded();

        simulation_controller_channels.insert(server.id, (controller_to_server_sender, controller_from_server_receiver));

        // Set the channels for the communication between the nodes
        let packet_recv = intra_node_channels.get(&server.id).unwrap().1.clone();
        let mut packet_send = HashMap::new();

        for neighbour in server.connected_drone_ids {
            packet_send.insert(
                neighbour,
                intra_node_channels.get(&neighbour).unwrap().0.clone(),
            );
        }

        // Create and spawn new servers
        let handle = thread::spawn(move || {
            let mut server = node::SimpleHost::new(
                server.id,
                NodeType::Client,
                server_to_controller_sender,
                server_from_controller_receiver,
                packet_recv,
                packet_send
            );
            server.run();
        });
        handles.push(handle);
    }

    // Create and start the simulation controller
    // let params = simulation_controller::SimulationControllerParams {
    //     handles,
    //     communication_channels: simulation_controller_channels,
    //     drone_ids,
    //     client_ids,
    //     server_ids
    // };
    //
    // let mut sim_controller = simulation_controller::RustBustersSimulationController::new(params);
    //
    // sim_controller.start_simulation();

    // Wait for all the childs to terminate before terminating the whole program
    info!("Waiting the end of execution of the nodes");
    for handle in handles {
        match handle.join() {
            Ok(_) => debug!("Successfully joined the nodes"),
            Err(e) => error!("Failed to join the nodes: {:?}", e),
        }
    }
}
