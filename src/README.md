# Guillotine Source Packages

This directory contains the core packages that make up Guillotine, a high-performance EVM implementation in Zig.

## 📦 Package Overview

### `evm/` - Ethereum Virtual Machine
The heart of Guillotine - a complete EVM implementation with configurable execution strategies.
- **Purpose**: Execute Ethereum smart contracts with full opcode support
- **Key Features**: 
  - Frame-based execution model
  - Configurable gas costs and hardforks
  - Multiple optimization strategies (simple, advanced)
  - Pluggable database interface
  - Comprehensive tracing support
- **Entry Point**: `evm/root.zig`

### `primitives/` - Ethereum Primitives
Core Ethereum data types and utilities, similar to Alloy or Ethers.js but in Zig.
- **Purpose**: Provide fundamental Ethereum types and operations
- **Includes**:
  - `Address` - 20-byte Ethereum addresses
  - `u256` - 256-bit unsigned integers for EVM
  - `Hex` - Hexadecimal encoding/decoding
  - `RLP` - Recursive Length Prefix encoding
  - `Bloom` - Bloom filters for logs
  - `Transaction` types and signing
- **Entry Point**: `primitives/root.zig`

### `crypto/` - Cryptographic Functions
Ethereum-specific cryptographic operations (🧪 unaudited - not production ready).
- **Purpose**: Provide crypto primitives for Ethereum operations
- **Includes**:
  - Keccak-256 hashing
  - secp256k1 signatures and recovery
  - BN254 elliptic curve operations
  - Blake2 hashing
  - KZG commitments
- **Entry Point**: `crypto/root.zig`

### `compilers/` - Compiler Integration
Zig bindings for the Foundry compiler infrastructure.
- **Purpose**: Compile Solidity/Vyper contracts from Zig
- **Status**: Work in progress
- **Goal**: Native compilation without external dependencies

### `devtool/` - Development Tools (WIP)
Future native development tools combining Zig backend with Solid.js frontend.
- **Purpose**: Local-first development environment for Ethereum
- **Vision**: Native alternative to web-based tools like Tenderly
- **Status**: Planning phase

### `provider/` - Ethereum Provider (WIP)
HTTP-based Ethereum JSON-RPC provider implementation.
- **Purpose**: Interact with Ethereum nodes from Zig
- **Features**: JSON-RPC 2.0 client for Ethereum methods
- **Status**: Planning phase

### `bn254_wrapper/` - BN254 Rust Wrapper (Temporary)
Temporary Rust wrapper for BN254 elliptic curve operations.
- **Purpose**: Production-grade scalar multiplication and pairing
- **Dependencies**: arkworks ecosystem
- **Future**: Will be replaced with pure Zig implementation

### `revm_wrapper/` - REVM Integration
Wrapper for differential testing against the reference Rust EVM.
- **Purpose**: Ensure correctness by comparing against revm
- **Usage**: Testing and validation only
- **Note**: Not part of the production codebase

### Other Files

- `root.zig` - Main library entry point exporting all public modules
- `evm_c.zig` - C FFI bindings for cross-language EVM usage
- `main.zig` - CLI application entry point

## 🏗️ Architecture Notes

1. **Module Independence**: Each package is designed to be usable independently
2. **Zero Runtime Cost**: Heavy use of comptime configuration for performance
3. **Clean Interfaces**: Well-defined boundaries between packages
4. **Testing**: Each package includes comprehensive tests in the same files
5. **Documentation**: Extensive inline documentation in each module

## 🎯 Getting Started

To use a specific package in your Zig project:

```zig
// Import the entire Guillotine library
const guillotine = @import("guillotine");

// Or import specific packages
const evm = @import("guillotine").evm;
const primitives = @import("guillotine").primitives;
const Address = primitives.Address;
```

For detailed documentation on each package, see the `root.zig` file in each package directory.