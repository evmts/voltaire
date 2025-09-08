# Guillotine EVM Swift SDK

Swift bindings for the Guillotine EVM implementation.

## Requirements

- Swift 5.9+
- macOS 12.0+ / iOS 15.0+
- Guillotine shared library built (`libguillotine_ffi.dylib`)

## Building the Shared Library

Before using the Swift SDK, you need to build the Guillotine shared library:

```bash
cd ../..  # Navigate to Guillotine root
zig build
```

This will create `libguillotine_ffi.dylib` in `zig-out/lib/`.

## Installation

### Swift Package Manager

Add this package to your `Package.swift`:

```swift
dependencies: [
    .package(path: "path/to/Guillotine/sdks/swift")
]
```

## Usage

### Basic Example

```swift
import GuillotineEVM

// Create block context
let coinbase = Address(hex: "0x0000000000000000000000000000000000000000")!
let blockInfo = BlockInfo(
    number: 1,
    timestamp: 1000,
    gasLimit: 30_000_000,
    coinbase: coinbase,
    baseFee: 1_000_000_000,
    chainId: 1
)

// Create EVM instance
let evm = try GuillotineEVM(blockInfo: blockInfo)

// Set up an account with balance
let account = Address(hex: "0x0000000000000000000000000000000000000010")!
let balance = U256(1_000_000_000_000_000_000) // 1 ETH
try evm.setBalance(address: account, balance: balance)

// Deploy a contract
let contractAddress = Address(hex: "0x0000000000000000000000000000000000000020")!
let bytecode = Data([
    0x60, 0x2a,  // PUSH1 42
    0x60, 0x00,  // PUSH1 0
    0x52,        // MSTORE
    0x60, 0x20,  // PUSH1 32
    0x60, 0x00,  // PUSH1 0
    0xf3         // RETURN
])
try evm.setCode(address: contractAddress, code: bytecode)

// Call the contract
let params = CallParameters(
    caller: account,
    to: contractAddress,
    value: .zero,
    input: Data(),
    gas: 100_000,
    callType: .call
)

let result = try evm.call(params)
print("Success: \(result.success)")
print("Gas left: \(result.gasLeft)")
print("Output: \(result.output.map { String(format: "%02x", $0) }.joined())")
```

### Address Handling

```swift
// Create from hex string
let addr1 = Address(hex: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9")
let addr2 = Address(hex: "742d35Cc6634C0532925a3b844Bc9e7595f0bEb9") // Without 0x prefix

// Create from data
let data = Data(repeating: 0, count: 20)
let addr3 = Address(bytes: data)

// Get hex representation
print(addr1?.hexString) // "0x742d35cc6634c0532925a3b844bc9e7595f0beb9"
```

### Working with U256

```swift
// Create from UInt64
let value1 = U256(42)
let value2 = U256(1_000_000_000_000_000_000) // 1 ETH in wei

// Zero value
let zero = U256.zero
```

### Call Types

```swift
// Regular call
let call = CallParameters(
    caller: caller,
    to: contract,
    value: U256(1000),
    input: Data(),
    gas: 100_000,
    callType: .call
)

// Delegate call
let delegateCall = CallParameters(
    caller: caller,
    to: contract,
    value: .zero,
    input: Data(),
    gas: 100_000,
    callType: .delegateCall
)

// Static call (read-only)
let staticCall = CallParameters(
    caller: caller,
    to: contract,
    value: .zero,
    input: Data(),
    gas: 100_000,
    callType: .staticCall
)
```

### Simulation

Simulate calls without modifying state:

```swift
let result = try evm.simulate(params)
// State is not modified
```

## Testing

Run tests with:

```bash
swift test
```

Make sure the shared library is built before running tests.

## Important Notes

1. **Addresses 0x01-0x09 are reserved for precompiled contracts** - avoid using these for regular contracts
2. The EVM instance is automatically cleaned up when deallocated
3. All operations that modify state should use proper error handling
4. The library must be initialized before use (handled automatically by GuillotineEVM)

## Error Handling

All EVM operations can throw errors:

```swift
do {
    let evm = try GuillotineEVM(blockInfo: blockInfo)
    try evm.setBalance(address: account, balance: balance)
    let result = try evm.call(params)
} catch EVMError.initializationFailed(let message) {
    print("Failed to initialize: \(message)")
} catch EVMError.callFailed(let message) {
    print("Call failed: \(message)")
} catch {
    print("Unexpected error: \(error)")
}
```

## License

See the main Guillotine repository for license information.