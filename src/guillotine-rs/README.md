# guillotine-rs

A safe Rust wrapper around the Guillotine EVM - a high-performance Ethereum Virtual Machine implementation written in Zig.

## Overview

This crate provides idiomatic Rust bindings to Guillotine, allowing Rust developers to leverage a fast, native EVM implementation with zero-copy FFI where possible. The wrapper is designed with safety, performance, and ease of use in mind.

## Features

- **Safe API**: All unsafe FFI calls are wrapped in safe Rust abstractions
- **Zero-copy where possible**: Minimizes data copying between Rust and Zig
- **Idiomatic Rust**: Uses standard Rust patterns like `Result`, `Option`, and RAII
- **Compatible with Ethereum ecosystem**: Works with alloy-primitives types
- **Thread-safe**: VM instances can be safely sent between threads
- **Comprehensive error handling**: All errors are properly propagated

## Usage

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