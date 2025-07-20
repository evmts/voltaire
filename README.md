# Guillotine

A high-performance Ethereum Virtual Machine (EVM) implementation written in Zig.

## Overview

Guillotine is a blazing-fast, memory-efficient EVM implementation designed for correctness, performance, and safety. Built from the ground up in Zig, it features a modular architecture with first-class support for all Ethereum opcodes, precompiled contracts, and multiple deployment targets including native and WebAssembly.

### Key Features

- **Pure Zig Implementation**: Core EVM engine written entirely in Zig for maximum performance and safety
- **Comprehensive Opcode Support**: All EVM opcodes implemented with correct gas accounting
- **Precompiled Contracts**: Full support for Ethereum precompiles with optimized implementations
- **Multiple Targets**: Native builds for x86/ARM and WebAssembly support
- **Memory Safe**: Leverages Zig's compile-time memory safety guarantees
- **Modular Design**: Clean separation of concerns with well-defined module boundaries
- **Builder Pattern**: Intuitive API for constructing EVM instances and execution contexts

## Installation

### Using Zig Package Manager

Add Guillotine to your project using `zig fetch`:

```bash
zig fetch --save git+https://github.com/evmts/Guillotine#main
```

Then add it to your `build.zig.zon`:

```zig
.dependencies = .{
    .guillotine = .{
        .url = "git+https://github.com/evmts/Guillotine#main",
        .hash = "<hash from zig fetch>",
    },
},
```

### Prerequisites

- **Zig 0.14.1 or later** - Required for fuzzing support and latest language features
- **Rust toolchain** (optional) - Only needed for native BN254 precompile optimizations
- **Cargo** (optional) - For building Rust dependencies

## Quick Start

### Basic EVM Usage

```zig
const std = @import("std");
const Evm = @import("guillotine").Evm;
const primitives = @import("guillotine").primitives;

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    
    // Create in-memory state database
    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    // Initialize EVM instance
    const db_interface = memory_db.to_database_interface();
    var vm = try Evm.Evm.init(allocator, db_interface);
    defer vm.deinit();
    
    // Deploy a simple contract that returns 42
    const bytecode = [_]u8{
        0x60, 0x2A, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    // Create contract instance
    const contract_address = primitives.Address.from_u256(0x1234);
    var contract = Evm.Contract.init_at_address(
        contract_address, // caller
        contract_address, // address
        0,               // value
        100_000,         // gas limit
        &bytecode,       // code
        &[_]u8{},       // input data
        false,          // not static call
    );
    defer contract.deinit(allocator, null);
    
    // Set contract code in state
    try vm.state.set_code(contract_address, &bytecode);
    
    // Execute contract
    const result = try vm.interpret(&contract, &[_]u8{});
    defer if (result.output) |output| allocator.free(output);
    
    std.debug.print("Execution status: {}\n", .{result.status});
    if (result.output) |output| {
        std.debug.print("Return value: {}\n", .{std.mem.readInt(u256, output[0..32], .big)});
    }
}
```

### Using the Frame Builder Pattern

Guillotine provides a convenient builder pattern for constructing execution frames:

```zig
// Create a frame using the builder pattern
var builder = Evm.Frame.builder(allocator);
var frame = try builder
    .withVm(&vm)
    .withContract(&contract)
    .withGas(1_000_000)
    .withCaller(caller_address)
    .withInput(&input_data)
    .build();
defer frame.deinit();

// Execute operations within the frame
try frame.stack.push(10);
try frame.stack.push(20);

const interpreter_ptr: *Evm.Operation.Interpreter = @ptrCast(&vm);
const state_ptr: *Evm.Operation.State = @ptrCast(&frame);
_ = try vm.table.execute(0, interpreter_ptr, state_ptr, 0x01); // ADD

const result = try frame.stack.pop();
std.debug.print("10 + 20 = {}\n", .{result});
```

## Building and Testing

### Build Commands

```bash
# Build native library
zig build

# Build with specific optimization
zig build -Doptimize=ReleaseFast

# Build WebAssembly target
zig build wasm

# Run the executable
zig build run
```

### Running Tests

```bash
# Run all tests
zig build test

# Run tests with debug logging
zig build test -- --debug

# Run fuzzing tests (requires Zig 0.14.1+)
zig build test --fuzz
```

### Benchmarking

```bash
# Run benchmarks
zig build bench

# Run specific benchmark suite
zig build bench -- stack
```

## Architecture

### Module Structure

Guillotine is organized into distinct modules for clarity and maintainability:

- **`primitives`** - Core Ethereum types (Address, Hash, U256, etc.)
- **`crypto`** - Cryptographic primitives (Keccak256, secp256k1, etc.)
- **`evm`** - Main EVM implementation
  - **`frame`** - Execution context and call frames
  - **`stack`** - 256-bit word stack implementation
  - **`memory`** - Byte-addressable memory
  - **`state`** - Blockchain state management
  - **`opcodes`** - Opcode definitions and metadata
  - **`execution`** - Opcode implementations by category
  - **`precompiles`** - Built-in contract implementations
- **`trie`** - Merkle Patricia Trie implementation
- **`provider`** - JSON-RPC provider interface
- **`compilers`** - Solidity compilation support

### Design Principles

1. **Zero-Allocation Philosophy**: Minimize allocations for performance
2. **Explicit Error Handling**: All errors are explicit and recoverable
3. **No Hidden State**: All state changes are explicit and traceable
4. **Modular Boundaries**: Clear interfaces between components
5. **Test Everything**: Comprehensive test coverage with no abstractions

## Precompiled Contracts

Guillotine implements all Ethereum precompiled contracts:

| Address | Name | Native | WASM | Implementation |
|---------|------|--------|------|----------------|
| `0x01` | ECRECOVER | ✅ | ✅ | Pure Zig |
| `0x02` | SHA256 | ✅ | ✅ | Pure Zig |
| `0x03` | RIPEMD160 | ✅ | ✅ | Pure Zig |
| `0x04` | IDENTITY | ✅ | ✅ | Pure Zig |
| `0x05` | MODEXP | ✅ | ✅ | Pure Zig |
| `0x06` | ECADD | ✅ | ✅ | Pure Zig (BN254) |
| `0x07` | ECMUL | ✅ | ⚠️ | Rust/Placeholder |
| `0x08` | ECPAIRING | ✅ | ⚠️ | Rust/Limited |
| `0x09` | BLAKE2F | ✅ | ✅ | Pure Zig |
| `0x0a` | KZG_POINT_EVALUATION | ✅ | ✅ | C-KZG-4844 |

### Implementation Notes

- **Native builds** use optimized Rust implementations for BN254 operations (ECMUL, ECPAIRING)
- **WASM builds** use pure Zig implementations with limited zkSNARK support
- All precompiles correctly implement gas costs for different hard forks

## Advanced Usage

### Custom State Database

Implement the `DatabaseInterface` to provide custom state storage:

```zig
const MyDatabase = struct {
    // Your storage implementation
    
    pub fn to_database_interface(self: *MyDatabase) Evm.DatabaseInterface {
        return .{
            .ptr = self,
            .get_balance = getBalance,
            .get_code = getCode,
            .get_storage = getStorage,
            // ... other methods
        };
    }
    
    fn getBalance(ptr: *anyopaque, address: primitives.Address) !u256 {
        const self: *MyDatabase = @ptrCast(@alignCast(ptr));
        // Your implementation
    }
};
```

### Hard Fork Configuration

Configure EVM behavior for different Ethereum hard forks:

```zig
var vm = try Evm.Evm.init(allocator, db_interface);
vm.hardfork = .Shanghai; // or .London, .Berlin, etc.
```

### Gas Metering

Access detailed gas consumption information:

```zig
const initial_gas = frame.gas_remaining;
// Execute operations...
const gas_used = initial_gas - frame.gas_remaining;
std.debug.print("Gas consumed: {}\n", .{gas_used});
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code style and standards
- Testing requirements
- Submission process
- Development workflow

## Performance

Guillotine is designed for high performance:

- **Minimal allocations**: Stack-based execution where possible
- **Efficient opcodes**: Direct jump table dispatch
- **Optimized precompiles**: Native implementations for critical paths
- **Memory pooling**: Reusable memory buffers for frames

Benchmark results on modern hardware show Guillotine performing competitively with leading EVM implementations.

## Security

Guillotine prioritizes security:

- Memory-safe language (Zig) prevents common vulnerabilities
- Comprehensive test suite including fuzzing
- Strict gas accounting prevents DoS attacks
- No unsafe operations in core EVM logic

## License

Guillotine is open source software licensed under the MIT License.

## Acknowledgments

- The Ethereum Foundation for EVM specifications
- The Zig community for an excellent systems programming language
- Contributors to the revm project for reference implementations

---

*Guillotine - Fast, safe, and correct Ethereum execution*