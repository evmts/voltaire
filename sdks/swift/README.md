# GuillotineEVM Swift Bindings

> Experimental/PoC: This SDK is a vibecoded proof-of-concept. APIs are unstable and may change. We’re looking for early users to try it and tell us what APIs you want — please open an issue or ping us on Telegram.

## Status

- Maturity: Experimental proof‑of‑concept
- API stability: Unstable; breaking changes expected
- Feedback: https://github.com/evmts/Guillotine/issues or Telegram https://t.me/+ANThR9bHDLAwMjUx

Swift bindings for the Guillotine EVM, providing a comprehensive, performant, and developer-friendly interface to the Ethereum Virtual Machine.

## Features

- **Complete EVM Implementation**: Full Ethereum Virtual Machine with gas accounting, state management, and precompiles
- **Swift-First Design**: Leverages Swift's type system, async/await, and error handling
- **Cross-Platform**: Supports macOS, iOS, watchOS, and tvOS
- **High Performance**: Direct C interop with the native Zig implementation
- **Memory Safe**: Automatic resource management using Swift's ARC
- **Comprehensive Testing**: Full test suite with XCTest

## Installation

### Swift Package Manager

Add the following to your `Package.swift` file:

```swift
dependencies: [
    .package(path: "../guillotine-swift")
]
```

Or add it through Xcode by going to File → Add Package Dependencies and entering the path to this directory.

## Quick Start

```swift
import GuillotineEVM
import GuillotinePrimitives

// Create EVM instance
let evm = try EVM()

// Execute bytecode
let bytecode = Bytes([0x60, 0x42]) // PUSH1 0x42
let result = try await evm.execute(bytecode: bytecode)

print("Execution successful: \(result.isSuccess)")
print("Gas used: \(result.gasUsed)")
```

## Core Types

### Primitives

- **`Address`**: 20-byte Ethereum address with hex string support
- **`U256`**: 256-bit unsigned integer with arithmetic operations
- **`Hash`**: 32-byte hash value for blockchain data
- **`Bytes`**: Variable-length byte arrays with hex encoding

### EVM Execution

- **`EVM`**: Main execution engine with async/await support
- **`ExecutionResult`**: Comprehensive execution results with gas usage and return data
- **`GuillotineError`**: Typed error handling for all EVM operations

## Examples

### Working with Addresses

```swift
// Create from hex string
let address: Address = "0x1234567890123456789012345678901234567890"

// Create zero address
let zero = Address.zero

// Convert to/from bytes
let bytes = address.rawBytes
let fromBytes = try Address(bytes)
```

### Working with U256

```swift
// Create from integer
let value = U256(12345)

// Create from hex
let bigValue = try U256(hex: "0x1fffffffffffffffffffffffffffffffffffff")

// Arithmetic operations
let sum = try value.adding(U256(100))
let difference = try bigValue.subtracting(U256(1))
```

### EVM State Management

```swift
let evm = try EVM()

// Set account balance
let address: Address = "0x1234567890123456789012345678901234567890"
try evm.setBalance(address, balance: U256(1000))

// Deploy contract code
let contractCode = Bytes([0x60, 0x80, 0x60, 0x40, 0x52])
try evm.setCode(address, code: contractCode)

// Execute with parameters
let result = try await evm.execute(
    bytecode: contractCode,
    caller: Address.zero,
    to: address,
    value: U256(100),
    input: Bytes([0x01, 0x02, 0x03]),
    gasLimit: 1_000_000
)
```

## Architecture

The Swift bindings follow a three-layer architecture:

1. **GuillotineC**: C interop layer that bridges to the native Zig implementation
2. **GuillotinePrimitives**: Core Ethereum types with Swift-native APIs
3. **GuillotineEVM**: High-level EVM execution engine with async support

### Thread Safety

All types are marked as `Sendable` and the EVM class uses internal locking to ensure thread safety. You can safely use EVM instances across multiple tasks and actors.

### Memory Management

The Swift bindings use automatic reference counting (ARC) for memory management. The native Zig resources are automatically cleaned up when Swift objects are deallocated.

## Platform Support

- **macOS 13.0+**
- **iOS 16.0+**
- **watchOS 9.0+**
- **tvOS 16.0+**

## Testing

Run the test suite:

```bash
swift test
```

Or from Xcode, press Cmd+U to run all tests.

## Error Handling

The Swift bindings use typed error handling:

```swift
do {
    let result = try await evm.execute(bytecode: bytecode)
    // Handle successful execution
} catch GuillotineError.executionFailed {
    // Handle execution failure
} catch GuillotineError.invalidBytecode {
    // Handle invalid bytecode
} catch {
    // Handle other errors
}
```

## Performance

The Swift bindings provide zero-cost abstractions over the native Zig implementation. All performance-critical operations are handled by the native code with minimal Swift overhead.

## License

Same as the main Guillotine project.
