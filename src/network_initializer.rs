use client::RustbustersClient;
use common_utils::{HostCommand, HostEvent};
use crossbeam_channel::{unbounded, Receiver, Sender};
use log::info;
use rustbusters_drone::RustBustersDrone;
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

pub struct NetworkInitializer {
    drone_ids: Vec<NodeId>,
    client_ids: Vec<NodeId>,
    server_ids: Vec<NodeId>,
    intra_node_channels: HashMap<NodeId, (Sender<Packet>, Receiver<Packet>)>,
    drone_controller_channels: HashMap<NodeId, (Sender<DroneCommand>, Receiver<DroneEvent>)>,
    client_controller_channels: HashMap<NodeId, (Sender<HostCommand>, Receiver<HostEvent>)>,
    server_controller_channels: HashMap<NodeId, (Sender<HostCommand>, Receiver<HostEvent>)>,
    handles: Vec<thread::JoinHandle<()>>,
    config: Option<Config>,
}

impl NetworkInitializer {
    pub fn new() -> Self {
        Self {
            drone_ids: Vec::new(),
            client_ids: Vec::new(),
            server_ids: Vec::new(),
            intra_node_channels: HashMap::new(),
            drone_controller_channels: HashMap::new(),
            client_controller_channels: HashMap::new(),
            server_controller_channels: HashMap::new(),
            handles: Vec::new(),
            config: None,
        }
    }

    pub fn launch(mut self) {
        self.config();

        self.init_communication();
        self.launch_drones();
        self.launch_clients();
        self.launch_servers();
        self.launch_simulation_controller();
    }

    fn config(&mut self) {
        env_logger::init();
        dotenv().ok();

        let config_data = fs::read_to_string("input.toml").expect("Unable to read config file");
        let config: Config = toml::from_str(&config_data).expect("Unable to parse TOML");
        self.config = Some(config);
    }

    fn init_communication(&mut self) {
        if let Some(config) = &self.config {
            // Crossbeam channels for each drone
            info!("Initializing communication for nodes");
            for drone in &config.drone {
                let (sender, receiver) = unbounded();
                self.intra_node_channels
                    .insert(drone.id, (sender, receiver));
                self.drone_ids.push(drone.id);
            }

            // Crossbeam channels for each client
            for client in &config.client {
                let (sender, receiver) = unbounded();
                self.intra_node_channels
                    .insert(client.id, (sender, receiver));
                self.client_ids.push(client.id);
            }

            // Crossbeam channels for each server
            for server in &config.server {
                let (sender, receiver) = unbounded();
                self.intra_node_channels
                    .insert(server.id, (sender, receiver));
                self.server_ids.push(server.id);
            }
        }
    }

    fn launch_drones(&mut self) {
        if let Some(config) = &self.config {
            // Set up each drone
            info!("Creating and spawning Drones");
            for drone in config.drone.clone() {
                // Channels for communication between the drone and the simulation controller
                let (controller_to_drone_sender, drone_from_controller_receiver) = unbounded();
                let (drone_to_controller_sender, controller_from_drone_receiver) = unbounded();

                self.drone_controller_channels.insert(
                    drone.id,
                    (controller_to_drone_sender, controller_from_drone_receiver),
                );

                // Set the channels for the communication between the nodes
                let packet_recv = self.intra_node_channels.get(&drone.id).unwrap().1.clone();
                let mut packet_send = HashMap::new();

                for neighbour in drone.connected_node_ids {
                    packet_send.insert(
                        neighbour,
                        self.intra_node_channels.get(&neighbour).unwrap().0.clone(),
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

                self.handles.push(handle);
            }
        }
    }

    fn launch_clients(&mut self) {
        if let Some(config) = &self.config {
            // Set up each client
            info!("Creating and spawning Clients");
            for client in config.client.clone() {
                // Channels for communication between the client and the simulation controller
                let (controller_to_client_sender, client_from_controller_receiver) = unbounded();
                let (client_to_controller_sender, controller_from_client_receiver) = unbounded();

                self.client_controller_channels.insert(
                    client.id,
                    (controller_to_client_sender, controller_from_client_receiver),
                );

                // Set the channels for the communication between the nodes
                let packet_recv = self.intra_node_channels.get(&client.id).unwrap().1.clone();
                let mut packet_send = HashMap::new();

                for neighbour in client.connected_drone_ids {
                    packet_send.insert(
                        neighbour,
                        self.intra_node_channels.get(&neighbour).unwrap().0.clone(),
                    );
                }

                // Create and spawn new clients
                let handle = thread::spawn(move || {
                    let mut client = RustbustersClient::new(
                        client.id,
                        client_to_controller_sender,
                        client_from_controller_receiver,
                        packet_recv,
                        packet_send,
                        None,
                    );
                    client.run();
                });
                self.handles.push(handle);
            }
        }
    }

    fn launch_servers(&mut self) {
        if let Some(config) = &self.config {
            // Set up each server
            info!("Creating and spawning Servers");
            let server_ip: [u8; 4] = env::var("SERVER_IP")
                .expect("SERVER_IP must be set in .env file")
                .parse::<Ipv4Addr>()
                .expect("SERVER_IP must be a valid IpV4 IP address")
                .octets();
            let port = env::var("SERVER_PORT")
                .expect("SERVER_PORT must be set in .env file")
                .parse::<u16>()
                .expect("Error in parsing HTTP_SERVER_PORT from .env");
            let server_public_path = env::var("SERVER_PUBLIC_PATH")
                .expect("SERVER_PUBLIC_PATH must be set in .env file");

            let server_controller =
                RustBustersServerController::new(server_ip, port, server_public_path);
            server_controller.launch();

            for server in config.server.clone() {
                let (controller_to_server_sender, server_from_controller_receiver) = unbounded();
                let (server_to_controller_sender, controller_from_server_receiver) = unbounded();

                self.server_controller_channels.insert(
                    server.id,
                    (controller_to_server_sender, controller_from_server_receiver),
                );

                // Set the channels for the communication between the nodes
                let packet_recv = self.intra_node_channels.get(&server.id).unwrap().1.clone();
                let mut packet_send = HashMap::new();

                for neighbour in server.connected_drone_ids {
                    packet_send.insert(
                        neighbour,
                        self.intra_node_channels.get(&neighbour).unwrap().0.clone(),
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
                        format!(
                            "ws://{}:{}",
                            server_ip
                                .iter()
                                .map(|n| n.to_string())
                                .collect::<Vec<String>>()
                                .join("."),
                            port + 1
                        ),
                        None,
                    );
                    server.launch();
                });
                self.handles.push(handle);
            }
        }
    }

    fn launch_simulation_controller(self) {
        // Create and start the simulation controller
        if let Some(config) = &self.config {
            info!("Creating and spawning Simulation Controller");
            let params = simulation_controller::SimulationControllerParams {
                handles: self.handles,
                node_channels: self.intra_node_channels,
                drone_controller_channels: self.drone_controller_channels.clone(),
                client_controller_channels: self.client_controller_channels.clone(),
                server_controller_channels: self.server_controller_channels.clone(),
                drones: config.drone.clone(),
                clients: config.client.clone(),
                servers: config.server.clone(),
            };
            let sim_controller = RustBustersSimulationController::new(params);

            match simulation_controller::run(sim_controller) {
                Ok(_) => (),
                Err(error) => panic!("Unable to run simulation: {}", error),
            }

            // Wait for all the childs to terminate before terminating the whole program
            // info!("Waiting the end of execution of the nodes");
            // for handle in handles {
            //     match handle.join() {
            //         Ok(_) => debug!("Successfully joined the nodes"),
            //         Err(e) => error!("Failed to join the nodes: {:?}", e),
            //     }
            // }
        }
    }
}
