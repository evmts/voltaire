# guillotine-rs

> Experimental/PoC: This SDK is a vibecoded proof-of-concept. APIs are unstable and may change. We're looking for early users to try it and tell us what APIs you want — please open an issue or ping us on Telegram.

📚 **[View Full Documentation](https://guillotine.dev/sdks/rust)**

## Status

- Maturity: Experimental proof‑of‑concept
- API stability: Unstable; breaking changes expected
- Feedback: https://github.com/evmts/Guillotine/issues or Telegram https://t.me/+ANThR9bHDLAwMjUx

A safe Rust wrapper around the Guillotine EVM - a high-performance Ethereum Virtual Machine implementation written in Zig.

## Overview

This crate provides idiomatic Rust bindings to Guillotine, allowing Rust developers to leverage a fast, native EVM implementation with zero-copy FFI where possible. The wrapper is designed with safety, performance, and ease of use in mind.

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
guillotine-rs = "0.1.0"
```

### Configuration via Feature Flags

Guillotine can be configured at compile-time through Cargo feature flags:

```toml
[dependencies]
guillotine-rs = { version = "0.1.0", features = ["hardfork-shanghai", "optimize-fast"] }
```

Available features:
- **Hardfork selection**: `hardfork-frontier`, `hardfork-homestead`, `hardfork-byzantium`, `hardfork-berlin`, `hardfork-london`, `hardfork-shanghai`, `hardfork-cancun` (default)
- **Optimization**: `optimize-fast` (max performance), `optimize-small` (min size), `optimize-safe` (balanced, default)
- **Configuration**: `max-call-depth-256/512/2048`, `stack-size-256/512/2048`, `large-memory-limit`, `small-memory-limit`, `large-arena`, `small-arena`
- **Features**: `tracing`, `disable-precompiles`, `disable-fusion`, `disable-gas-checks` (⚠️ testing only), `disable-balance-checks` (⚠️ testing only)

### Build Requirements

This crate requires the Guillotine EVM library. You have two options:

#### Option 1: Use Pre-compiled Binaries (Recommended)
The published crate includes pre-compiled libraries for common platforms:
- Linux (x64, ARM64)
- macOS (x64, ARM64)  
- Windows (x64)

#### Option 2: Build from Source
If your platform isn't supported or you want to build from source:

1. Install [Zig](https://ziglang.org/download/) (0.15.0 or later)
2. Clone the [Guillotine repository](https://github.com/evmts/guillotine)
3. Build the static library:
   ```bash
   zig build static
   ```
4. The library will be in `zig-out/lib/`

## Features

- **Safe API**: All unsafe FFI calls are wrapped in safe Rust abstractions
- **Zero-copy where possible**: Minimizes data copying between Rust and Zig
- **Idiomatic Rust**: Uses standard Rust patterns like `Result`, `Option`, and RAII
- **Compatible with Ethereum ecosystem**: Works with alloy-primitives types
- **Thread-safe**: VM instances can be safely sent between threads
- **Comprehensive error handling**: All errors are properly propagated

## Usage

### Basic Usage

```rust
use guillotine_rs::{Evm, EvmBuilder, ExecutionResult};
use alloy_primitives::{Address, U256};

// Create a new EVM instance
let mut evm = EvmBuilder::new()
    .with_gas_limit(1_000_000)
    .build()?;

// Set up accounts
let sender = Address::from([0x11; 20]);
let receiver = Address::from([0x22; 20]);

evm.set_balance(sender, U256::from(1_000_000))?;

// Deploy a contract
let bytecode = hex::decode("608060...")?;
let contract_address = evm.deploy_contract(sender, bytecode, U256::ZERO)?;

// Execute a contract call
let input = hex::decode("a9059cbb...")?; // transfer(address,uint256)
let result = evm.call(sender, contract_address, input, U256::ZERO)?;

match result {
    ExecutionResult::Success { output, gas_used, logs } => {
        println!("Success! Gas used: {}", gas_used);
    }
    ExecutionResult::Revert { output, gas_used } => {
        println!("Reverted: {:?}", output);
    }
    ExecutionResult::Failure { error, gas_used } => {
        println!("Failed: {}", error);
    }
}
```

### Configuration Examples

#### Performance-Optimized Build
```toml
[dependencies]
guillotine-rs = { 
    version = "0.1.0", 
    features = ["optimize-fast", "large-arena"] 
}
```

#### Minimal Size Build
```toml
[dependencies]
guillotine-rs = { 
    version = "0.1.0", 
    features = ["optimize-small", "small-arena", "disable-precompiles"] 
}
```

#### Testing Configuration
```toml
[dev-dependencies]
guillotine-rs = { 
    version = "0.1.0", 
    features = ["tracing", "disable-gas-checks", "disable-balance-checks"] 
}
```

## Architecture

The crate is structured in three layers:

1. **FFI Layer** (`ffi` module): Raw bindings to Guillotine's C API
2. **Safe Wrapper** (`core` module): Safe abstractions over the FFI layer
3. **High-level API** (`api` module): Idiomatic Rust interface

## Performance

Guillotine is designed for high performance with:
- Minimal allocations
- Efficient opcode dispatch via jump tables
- Optimized memory management
- Native Zig performance

## Benchmarks

Run benchmarks comparing Guillotine to other EVM implementations:

```bash
cargo bench
```

## Safety

This crate ensures safety by:
- Wrapping all unsafe FFI calls
- Proper lifetime management with RAII
- Validated inputs before passing to FFI
- No exposed raw pointers in the public API

## Building from Source

Prerequisites:
- Rust 1.70+
- Zig 0.14+
- C++ toolchain (for dependencies)

```bash
cargo build --release
```

## License

Same as Guillotine - [LICENSE]

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
