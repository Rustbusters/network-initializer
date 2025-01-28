mod network_initializer;

use network_initializer::NetworkInitializer;

fn main() {
    #![allow(warnings)]

    let mut network_initializer = NetworkInitializer::new();
    network_initializer.launch();
}
