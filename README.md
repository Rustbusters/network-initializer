# Network Initializer

### How to Set Up Logging in This Project

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

