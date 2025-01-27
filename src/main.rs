
use crossbeam_channel::{unbounded, Receiver, Sender};
use drone::RustBustersDrone;
use log::info;
use common_utils::{HostCommand, HostEvent};
use server::{RustBustersServer, RustBustersServerController};
use simulation_controller::RustBustersSimulationController;
use std::collections::HashMap;
use std::net::Ipv4Addr;
use std::{env, fs, thread};
use wg_2024::config::Config;
use wg_2024::controller::{DroneCommand, DroneEvent};
use wg_2024::drone::Drone;
use wg_2024::network::NodeId;
use wg_2024::packet::Packet;

use dotenv::dotenv;

#[tokio::main]
async fn main() {
    #![allow(warnings)];
    env_logger::init();

    dotenv().ok();

    // Vectors of thread initialized in this piece of code
    let mut handles = Vec::new();

    let mut drone_ids: Vec<NodeId> = Vec::new();
    let mut client_ids: Vec<NodeId> = Vec::new();
    let mut server_ids: Vec<NodeId> = Vec::new();

    let config_data = fs::read_to_string("input.toml").expect("Unable to read config file");
    let config: Config = toml::from_str(&config_data).expect("Unable to parse TOML");

    // TODO: Check if input is well parsed

    // Initialize crossbeam channels for internal communication
    let mut intra_node_channels: HashMap<NodeId, (Sender<Packet>, Receiver<Packet>)> =
        HashMap::new();
    let mut drone_controller_channels: HashMap<
        NodeId,
        (Sender<DroneCommand>, Receiver<DroneEvent>),
    > = HashMap::new();
    let mut client_controller_channels: HashMap<
        NodeId,
        (Sender<HostCommand>, Receiver<HostEvent>),
    > = HashMap::new();
    let mut server_controller_channels: HashMap<
        NodeId,
        (Sender<HostCommand>, Receiver<HostEvent>),
    > = HashMap::new();

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
    for drone in config.drone.clone() {
        // Channels for communication between the drone and the simulation controller
        let (controller_to_drone_sender, drone_from_controller_receiver) = unbounded();
        let (drone_to_controller_sender, controller_from_drone_receiver) = unbounded();

        drone_controller_channels.insert(
            drone.id,
            (controller_to_drone_sender, controller_from_drone_receiver),
        );

        // Set the channels for the communication between the nodes
        let packet_recv = intra_node_channels.get(&drone.id).unwrap().1.clone();
        let mut packet_send = HashMap::new();

        for neighbour in drone.connected_node_ids {
            packet_send.insert(
                neighbour,
                intra_node_channels.get(&neighbour).unwrap().0.clone(),
            );
        }

        let handle = thread::spawn(move || {
            let mut drone = RustBustersDrone::new(
                drone.id,
                drone_to_controller_sender,
                drone_from_controller_receiver,
                packet_recv,
                packet_send,
                drone.pdr,
            );
            drone.run();
        });

        handles.push(handle);
    }

    // TODO: implement initialization for clients and servers
    //info!("Creating and spawning Clients");
    //for client in config.client.clone() {
    //    // TODO: update general host to client
    //    // Channels for communication between the client and the simulation controller
    //    let (controller_to_client_sender, client_from_controller_receiver) = unbounded();
    //    let (client_to_controller_sender, controller_from_client_receiver) = unbounded();
    //
    //    client_controller_channels.insert(
    //        client.id,
    //        (controller_to_client_sender, controller_from_client_receiver),
    //    );
    //
    //    // Set the channels for the communication between the nodes
    //    let packet_recv = intra_node_channels.get(&client.id).unwrap().1.clone();
    //    let mut packet_send = HashMap::new();
    //
    //    for neighbour in client.connected_drone_ids {
    //        packet_send.insert(
    //            neighbour,
    //            intra_node_channels.get(&neighbour).unwrap().0.clone(),
    //        );
    //    }
    //
    //    // Create and spawn new clients
    //    let handle = thread::spawn(move || {
    //        let mut client = SimpleHost::new(
    //            client.id,
    //            NodeType::Client,
    //            client_to_controller_sender,
    //            client_from_controller_receiver,
    //            packet_recv,
    //            packet_send,
    //        );
    //        client.run();
    //    });
    //    handles.push(handle);
    //}

    info!("Creating and spawning Servers");
    let server_ip: [u8; 4] = env::var("SERVER_IP").expect("SERVER_IP must be set in .env file").parse::<Ipv4Addr>().expect("SERVER_IP must be a valid IpV4 IP address").octets();
    let server_http_port = env::var("HTTP_SERVER_PORT").expect("HTTP_SERVER_PORT must be set in .env file").parse::<u16>().expect("Error in parsing HTTP_SERVER_PORT from .env");
    let server_websocket_port = env::var("WEBSOCKET_SERVER_PORT").expect("WEBSOCKET_SERVER_PORT must be set in .env file").parse::<u16>().expect("Error in parsing WEBSOCKET_SERVER_PORT from .env");

    let server_controller: RustBustersServerController = RustBustersServerController::new(server_ip, server_http_port, "static/server/emeliyanov");
    tokio::spawn(async move {
        server_controller.launch().await.expect("Error in launching server controller");
    });

    for server in config.server.clone() {
        let (controller_to_server_sender, server_from_controller_receiver) = unbounded();
        let (server_to_controller_sender, controller_from_server_receiver) = unbounded();

        server_controller_channels.insert(
            server.id,
            (controller_to_server_sender, controller_from_server_receiver),
        );

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
            let mut server = RustBustersServer::new(
                server.id,
                server_to_controller_sender,
                server_from_controller_receiver,
                packet_recv,
                packet_send,
                format!("ws://{}:{}", server_ip.iter().map(|n| n.to_string()).collect::<Vec<String>>().join("."), server_websocket_port),
            );
            server.launch();
        });
        handles.push(handle);
    }

    // Create and start the simulation controller
    let params = simulation_controller::SimulationControllerParams {
        handles,
        node_channels: intra_node_channels,
        drone_controller_channels: drone_controller_channels.clone(),
        client_controller_channels: client_controller_channels.clone(),
        server_controller_channels: server_controller_channels.clone(),
        drones: config.drone.clone(),
        clients: config.client.clone(),
        servers: config.server.clone(),
    };

    let sim_controller = RustBustersSimulationController::new(params);

    // CLI option
    let mut cli = simulation_controller::SimulationControllerCLI::new(sim_controller);
    cli.run();

    // GUI Option
    // match simulation_controller::run(sim_controller){
    //     Ok(_) => (),
    //     Err(error) => panic!("Unable to run simulation: {}", error),
    // }

    // Wait for all the childs to terminate before terminating the whole program
    // info!("Waiting the end of execution of the nodes");
    // for handle in handles {
    //     match handle.join() {
    //         Ok(_) => debug!("Successfully joined the nodes"),
    //         Err(e) => error!("Failed to join the nodes: {:?}", e),
    //     }
    // }
}
