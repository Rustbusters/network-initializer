mod network_initializer;
mod utils;

use network_initializer::NetworkInitializer;

fn main() {
    #![allow(warnings)]

    let mut network_initializer = NetworkInitializer::new();
    network_initializer.launch();
}
