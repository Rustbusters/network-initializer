use std::{fs, thread};
use std::collections::HashMap;
use std::sync::mpsc::{Receiver, Sender};
use crossbeam_channel::unbounded;
use drone::RustBustersDrone;
use wg_2024::config::Config;
use wg_2024::controller::{DroneCommand, NodeEvent};
use wg_2024::drone::{Drone, DroneOptions};
use wg_2024::network::NodeId;
use wg_2024::packet::Packet;

fn main() {
    let config_data = fs::read_to_string("input.toml").expect("Unable to read config file");
    let config: Config = toml::from_str(&config_data).expect("Unable to parse TOML");

    // Senders and receivers used by the simulation controller to interact with
    // all the drones and the hosts present in the simulation
    let mut packet_senders = HashMap::<NodeId, Sender<Packet>>::new();
    let mut packet_receivers = Vec::new();
    let mut senders: Vec<Sender<DroneCommand>> = Vec::new();
    let mut receivers: Vec<Receiver<NodeEvent>> = Vec::new();

    // For each node i create an isolated communication channel between
    // this instance and the node instance
    for id in 0.. {
        let (packet_send, packet_recv) = unbounded();
        packet_senders.insert(id as NodeId, packet_send);
        packet_receivers.push(packet_recv);
    }
    
    let mut threads = Vec::new();

    for drone in config.drone {
        let drone_options = DroneOptions {
            id: drone.id,
            controller_send: ,
            controller_recv: ,
            packet_recv: ,
            packet_send: ,
            pdr: drone.pdr,
        }
        
        let handle = thread::spawn(move || {
            let mut drone = RustBustersDrone::new(drone_options);
            drone.run();
        });
    }
}
