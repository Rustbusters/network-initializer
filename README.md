# Network Initializer


### Introduction 🧩

The **Network Initializer** is responsible for setting up and managing the entire network infrastructure. Its main tasks include:  

- **Constructing the Network Graph**: It defines the structure of the network, establishing the relationships between different nodes (servers, clients, and drones). This ensures proper routing and communication between entities.  
- **Launching the Drones**: The drones act as dynamic entities, allowing network discovery and packet forwarding.
- **Launching Clients**: It initializes and connects the client nodes, ensuring they can communicate with the servers on the network.  
- **Launching Servers**: The servers are started with the appropriate configurations, enabling message handling, routing, and persistency mechanisms.  

By orchestrating these components, the **Network Initializer** ensures that the network is correctly set up and ready for operation. 🚀  


### How to Set Up Logging in This Project ✏️

This project uses `env_logger` for logging. Follow the steps below to enable and configure logging:

#### **1. Configure Log Levels**

Log levels determine the verbosity of the output. The available levels are:
- **`error`**: Only logs critical errors.
- **`warn`**: Logs warnings and errors.
- **`info`**: Logs general information, warnings, and errors.
- **`debug`**: Logs debugging information, in addition to all the above levels.
- **`trace`**: Logs the most detailed information.

---

#### **2. Set the Log Level**
You can configure the log level by setting the `RUST_LOG` environment variable.

- **Example Commands:**
    - Show only errors:
      ```bash
      RUST_LOG=error cargo run
      ```
    - Show general information and above:
      ```bash
      RUST_LOG=info cargo run
      ```
    - Enable detailed debugging:
      ```bash
      RUST_LOG=debug cargo run
      ```

- **Per Module Log Levels:**
  To configure log levels for specific modules or crates:
  ```bash
  RUST_LOG=my_crate=debug,other_module=info cargo run
  ```

---

#### **3. Example Usage in Code**
Here’s how to use different log levels in the code:

```rust
log::error!("Critical error encountered!");
log::warn!("Warning: Check the configuration.");
log::info!("System running smoothly.");
log::debug!("Processing request with ID {}", request_id);
log::trace!("Detailed trace for debugging.");
```

---

#### **4. Additional Notes**
- By default, the logger uses the `info` level if `RUST_LOG` is not set.
- The logger reads the `RUST_LOG` variable at runtime, so ensure it's set before running the application.
- It is also possible to set it to RustRover

### UI 🎨
The **UI** is a crucial component of this project, providing users with a clear and intuitive way to understand the network’s behavior, including packet forwarding, network discovery, and overall packet statistics. It serves as a visual and interactive bridge between the user and the underlying system.  

The UI is structured into three key elements:  

- **Simulation Controller**: The omniscient component responsible for monitoring the entire network. It has the most thorough view of the system, ensuring deep insights into network topology and activity.  
- **Client**: Provides a chat-like interface that allows users within the network to send and receive messages, enabling real-time communication.  
- **Server**: Hosts a monitoring dashboard that displays key server statistics, performance metrics, and messages stored in its local database.  