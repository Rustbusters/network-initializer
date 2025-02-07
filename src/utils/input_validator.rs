use std::collections::{HashMap, HashSet};
use std::result::Result;
use wg_2024::config::{Config};
use wg_2024::network::NodeId;

pub fn validate_config(config: &Config) -> Result<(), String> {
    check_uniqueness_of_ids(config)?;
    check_drones(config)?;
    check_servers(config)?;
    check_clients(config)?;
    check_connections(config)?;

    Ok(())
}

// Each id present in the file must be unique
fn check_uniqueness_of_ids(config: &Config) -> Result<(), String> {
    let mut id_set: HashSet<NodeId> = HashSet::new();

    for drone in &config.drone {
        if !id_set.insert(drone.id) {
            return Err(format!("There are multiple items with the same Id in the input file! Id = \"{}\"", drone.id))
        }
    }

    for server in &config.server {
        if !id_set.insert(server.id) {
            return Err(format!("There are multiple items with the same Id in the input file! Id = \"{}\"", server.id))
        }
    }

    for client in &config.client {
        if !id_set.insert(client.id) {
            return Err(format!("There are multiple items with the same Id in the input file! Id = \"{}\"", client.id))
        }
    }

    Ok(())
}


// This function checks that all the parameters for a drone respect the protocol
fn check_drones(config: &Config) -> Result<(), String> {
    for drone in &config.drone {
        if let Err(id) = check_ids(&drone.connected_node_ids, drone.id) {
            if drone.id == id {
                return Err(format!("Drone {} has itself as a neighbour!", drone.id))
            } else {
                return Err(format!("Drone {} has some repetitions between its neighbours! Repeated id = {}", drone.id, id))
            }
        }

        if let Err(()) = check_pdr_value(drone.pdr) {
            return Err(format!("The packet drop rate of drone \"{}\" is not in the right range! Correct range: [0 - 1]", drone.id))
        }
    }
    Ok(())
}

// This function checks that all the parameters for a server respect the protocol
fn check_servers(config: &Config) -> Result<(), String> {
    for server in &config.server {
        if let Err(id) = check_ids(&server.connected_drone_ids, server.id) {
            if server.id == id {
                return Err(format!("Server {} has itself as a neighbour!", server.id))
            } else {
                return Err(format!("Server {} has some repetitions between its neighbours! Repeated id = {}", server.id, id))
            }
        }

        if server.connected_drone_ids.len() < 2 {
            return Err(format!("Server {} has less than 2 connections", server.id))
        }
    }
    Ok(())
}

// This function checks that all the parameters for a client respect the protocol
fn check_clients(config: &Config) -> Result<(), String> {
    for client in &config.client {
        if let Err(id) = check_ids(&client.connected_drone_ids, client.id) {
            if client.id == id {
                return Err(format!("Client {} has itself as a neighbour!", client.id))
            } else {
                return Err(format!("Client {} has some repetitions between its neighbours! Repeated id = {}", client.id, id))
            }
        }

        if client.connected_drone_ids.is_empty() || client.connected_drone_ids.len() > 2 {
            return Err(format!("Client {} has less than 1 connection or more than 2", client.id))
        }
    }
    Ok(())
}

// Check that all connections are bidirectional
fn check_connections(config: &Config) -> Result<(), String> {
    let mut nodes_connections: HashMap<NodeId, Vec<NodeId>> = HashMap::new();

    for drone in &config.drone {
        if let std::collections::hash_map::Entry::Vacant(e) = nodes_connections.entry(drone.id) {
            e.insert(drone.connected_node_ids.clone());
        } else {
            return Err("Duplicated id".to_string())
        }

    }

    for server in &config.server {
        if let std::collections::hash_map::Entry::Vacant(e) = nodes_connections.entry(server.id) {
            e.insert(server.connected_drone_ids.clone());
        } else {
            return Err("Duplicated id".to_string())
        }
    }

    for client in &config.client {
        if let std::collections::hash_map::Entry::Vacant(e) = nodes_connections.entry(client.id) {
            e.insert(client.connected_drone_ids.clone());
        } else {
            return Err("Duplicated id".to_string())
        }

    }

    for key in nodes_connections.keys() {
        for id in nodes_connections.get(key).unwrap().iter() {
            if !nodes_connections.contains_key(id) {
                return Err(format!("Connection to a node that does not exists! From {} to {}", key, id));
            } else if !nodes_connections.get(id).unwrap().contains(key) {
                return Err(format!("Trying to establish a mono-directional connection! From {} to {}", key, id));
            }
        }
    }

    Ok(())
}

// Check for neighbour vector correctness
// 1. One node cannot have connections to itself
// 2. There can't be repetition in the connected_node_ids vector
fn check_ids(ids: &Vec<NodeId>, node_id: NodeId) -> Result<(), NodeId> {
    let mut set = HashSet::new();

    for id in ids {
        if node_id == *id {
            return Err(node_id)
        } else if !set.insert(id) {
            return Err(*id)
        }
    }

    Ok(())
}

// Check that pdr is in the right range [0 - 1]
fn check_pdr_value(pdr: f32) -> Result<(), ()> {
    if !(0. ..=1.).contains(&pdr) {
        Err(())
    } else {
        Ok(())
    }
}