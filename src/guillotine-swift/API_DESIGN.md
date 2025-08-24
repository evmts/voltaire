# Guillotine Swift API Design

## Overview

This document defines the comprehensive Swift API for the Guillotine EVM. The API is designed to be:
- **Type-safe**: Strong typing with Swift's type system  
- **Ergonomic**: Intuitive Swift patterns and conventions
- **Async-first**: Modern concurrency with async/await
- **Error-safe**: Comprehensive error handling
- **Performance-focused**: Zero-copy where possible

## Core Components

### 1. EVM Engine (`GuillotineEVM`)

The main execution engine providing both simple and advanced execution modes.

```swift
/// High-performance Ethereum Virtual Machine engine
@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
public actor GuillotineEVM {
    
    /// Execute bytecode with simple parameters
    public func execute(
        bytecode: Bytes,
        gasLimit: UInt64 = 1_000_000
    ) async throws -> ExecutionResult
    
    /// Execute a full transaction with comprehensive parameters
    public func executeTransaction(
        _ transaction: Transaction
    ) async throws -> TransactionResult
    
    /// Execute a contract call
    public func call(
        to address: Address,
        input: Bytes = .empty,
        value: U256 = .zero,
        from: Address = .zero,
        gasLimit: UInt64 = 1_000_000,
        context: ExecutionContext = .default
    ) async throws -> CallResult
    
    /// Deploy a new contract
    public func deploy(
        bytecode: Bytes,
        constructor: Bytes = .empty,
        value: U256 = .zero,
        from: Address = .zero,
        gasLimit: UInt64 = 1_000_000,
        context: ExecutionContext = .default
    ) async throws -> DeploymentResult
    
    /// Static call (read-only)
    public func staticCall(
        to address: Address,
        input: Bytes = .empty,
        from: Address = .zero,
        gasLimit: UInt64 = 1_000_000,
        context: ExecutionContext = .default
    ) async throws -> CallResult
}
```

### 2. State Management (`StateManager`) 

Manages account state, balances, code, and storage.

```swift
/// Manages EVM world state
public protocol StateManager: Sendable {
    /// Get account balance
    func getBalance(address: Address) async throws -> U256
    
    /// Set account balance  
    func setBalance(address: Address, balance: U256) async throws
    
    /// Get account nonce
    func getNonce(address: Address) async throws -> UInt64
    
    /// Set account nonce
    func setNonce(address: Address, nonce: UInt64) async throws
    
    /// Get contract code
    func getCode(address: Address) async throws -> Bytes
    
    /// Set contract code
    func setCode(address: Address, code: Bytes) async throws
    
    /// Get storage value
    func getStorage(address: Address, key: U256) async throws -> U256
    
    /// Set storage value
    func setStorage(address: Address, key: U256, value: U256) async throws
    
    /// Check if account exists
    func accountExists(address: Address) async throws -> Bool
    
    /// Create account snapshot for nested calls
    func createSnapshot() async throws -> StateSnapshot
    
    /// Revert to snapshot
    func revertToSnapshot(_ snapshot: StateSnapshot) async throws
    
    /// Commit snapshot
    func commitSnapshot(_ snapshot: StateSnapshot) async throws
}

/// Default in-memory state manager
public final class MemoryStateManager: StateManager, @unchecked Sendable {
    public init() async throws
}
```

### 3. Transaction and Context Types

Comprehensive transaction modeling with all EVM parameters.

```swift
/// Complete transaction representation
public struct Transaction: Sendable {
    public let from: Address
    public let to: Address?  // nil for contract creation
    public let value: U256
    public let input: Bytes
    public let gasLimit: UInt64
    public let gasPrice: U256
    public let nonce: UInt64
    
    public init(
        from: Address,
        to: Address? = nil,
        value: U256 = .zero,
        input: Bytes = .empty,
        gasLimit: UInt64 = 1_000_000,
        gasPrice: U256 = 20_000_000_000, // 20 gwei
        nonce: UInt64 = 0
    )
}

/// Execution environment context
public struct ExecutionContext: Sendable {
    public let blockNumber: UInt64
    public let blockTimestamp: UInt64
    public let blockGasLimit: UInt64
    public let coinbase: Address  // Block miner
    public let difficulty: U256
    public let chainId: UInt64
    
    public static var `default`: ExecutionContext
    
    public init(
        blockNumber: UInt64 = 1,
        blockTimestamp: UInt64 = 0,
        blockGasLimit: UInt64 = 30_000_000,
        coinbase: Address = .zero,
        difficulty: U256 = 0x2540be400, // 10_000_000_000
        chainId: UInt64 = 1
    )
}
```

### 4. Result Types

Comprehensive result types with detailed execution information.

```swift
/// Basic execution result
public struct ExecutionResult: Sendable {
    public let success: Bool
    public let gasUsed: UInt64
    public let returnData: Bytes
    public let revertReason: String?
    public let error: ExecutionError?
    
    public var isSuccess: Bool { success }
    public var isRevert: Bool { !success && revertReason != nil }
    public var isError: Bool { error != nil }
}

/// Contract call result
public struct CallResult: Sendable {
    public let success: Bool
    public let gasUsed: UInt64
    public let returnData: Bytes
    public let logs: [Log]
    public let revertReason: String?
    public let error: ExecutionError?
    
    /// Decode return data as specific type
    public func decode<T: ABIDecodable>(as type: T.Type) throws -> T
}

/// Contract deployment result  
public struct DeploymentResult: Sendable {
    public let success: Bool
    public let gasUsed: UInt64
    public let contractAddress: Address?
    public let logs: [Log]
    public let revertReason: String?
    public let error: ExecutionError?
}

/// Complete transaction result
public struct TransactionResult: Sendable {
    public let success: Bool
    public let gasUsed: UInt64
    public let returnData: Bytes
    public let logs: [Log]
    public let contractAddress: Address?  // For deployments
    public let revertReason: String?
    public let error: ExecutionError?
    public let stateChanges: [StateChange]
}
```

### 5. Enhanced Primitives

Extended primitive types with additional functionality.

```swift
// Address enhancements
extension Address {
    /// Generate random address
    public static func random() -> Address
    
    /// Create address from private key
    public static func from(privateKey: Bytes) throws -> Address
    
    /// Create contract address from deployer and nonce
    public static func contractAddress(from deployer: Address, nonce: UInt64) -> Address
    
    /// Create CREATE2 contract address
    public static func create2Address(
        from deployer: Address,
        salt: U256,
        initCodeHash: Bytes
    ) -> Address
    
    /// Check if address is contract (has code)
    public func isContract(in stateManager: StateManager) async throws -> Bool
}

// U256 arithmetic and utility enhancements
extension U256 {
    /// Safe arithmetic operations
    public func safeAdd(_ other: U256) throws -> U256
    public func safeSub(_ other: U256) throws -> U256
    public func safeMul(_ other: U256) throws -> U256
    public func safeDiv(_ other: U256) throws -> U256
    public func safeMod(_ other: U256) throws -> U256
    public func safePow(_ exponent: U256) throws -> U256
    
    /// Bitwise operations
    public func and(_ other: U256) -> U256
    public func or(_ other: U256) -> U256
    public func xor(_ other: U256) -> U256
    public func not() -> U256
    public func shiftLeft(_ positions: Int) -> U256
    public func shiftRight(_ positions: Int) -> U256
    
    /// Create from Wei/Ether
    public static func wei(_ amount: UInt64) -> U256
    public static func ether(_ amount: Double) -> U256
    public static func gwei(_ amount: UInt64) -> U256
}

// Bytes utilities
extension Bytes {
    /// Keccak256 hash
    public var keccak256: Bytes { get }
    
    /// Slice bytes
    public func slice(from start: Int, length: Int) throws -> Bytes
    
    /// Pad to specific length
    public func padded(to length: Int, with byte: UInt8 = 0) -> Bytes
    
    /// Convert to U256 (big-endian)
    public func toU256() throws -> U256
    
    /// Convert to Address (must be 20 bytes)
    public func toAddress() throws -> Address
}
```

### 6. Error Handling

Comprehensive error types for all failure modes.

```swift
/// Execution errors
public enum ExecutionError: Error, Sendable {
    case outOfGas
    case stackUnderflow
    case stackOverflow
    case invalidOpcode(UInt8)
    case invalidJumpDestination(UInt64)
    case revert(String?)
    case outOfMemory
    case callDepthExceeded
    case insufficientBalance
    case accountNotFound(Address)
    case codeNotFound(Address)
    case invalidTransaction(String)
    case internalError(String)
}

/// State management errors
public enum StateError: Error, Sendable {
    case accountNotFound(Address)
    case invalidBalance
    case invalidNonce  
    case storageError(String)
    case snapshotError(String)
}

/// Primitive type errors  
public enum PrimitiveError: Error, Sendable {
    case invalidLength(expected: Int, actual: Int)
    case invalidHexString(String)
    case overflow
    case underflow
    case divisionByZero
    case invalidAddress
    case invalidU256
}
```

### 7. Logging and Events

EVM event log support.

```swift
/// EVM event log
public struct Log: Sendable {
    public let address: Address
    public let topics: [U256]
    public let data: Bytes
    
    /// Decode log data as specific event type
    public func decode<T: EventDecodable>(as type: T.Type) throws -> T
}

/// State change tracking
public struct StateChange: Sendable {
    public enum Kind: Sendable {
        case balanceChange(Address, old: U256, new: U256)
        case nonceChange(Address, old: UInt64, new: UInt64)
        case codeChange(Address, old: Bytes, new: Bytes)
        case storageChange(Address, key: U256, old: U256, new: U256)
        case accountCreation(Address)
        case accountDestruction(Address)
    }
    
    public let kind: Kind
    public let gasUsed: UInt64
}
```

### 8. Convenience APIs

High-level convenience methods for common operations.

```swift
extension GuillotineEVM {
    /// Execute Solidity function call (if ABI available)
    public func callFunction<T: ABIDecodable>(
        contract: Address,
        function: String,
        parameters: [ABIEncodable],
        from: Address = .zero,
        value: U256 = .zero,
        gasLimit: UInt64 = 1_000_000
    ) async throws -> T
    
    /// Estimate gas for transaction
    public func estimateGas(
        for transaction: Transaction,
        context: ExecutionContext = .default
    ) async throws -> UInt64
    
    /// Simulate transaction (dry-run)
    public func simulate(
        _ transaction: Transaction,
        context: ExecutionContext = .default
    ) async throws -> SimulationResult
    
    /// Trace transaction execution
    public func trace(
        _ transaction: Transaction,
        tracer: ExecutionTracer
    ) async throws -> TraceResult
}
```

## Usage Examples

### Simple Execution
```swift
let evm = try await GuillotineEVM()
let bytecode: Bytes = "0x6001600101" // PUSH1 1, PUSH1 1, ADD
let result = try await evm.execute(bytecode: bytecode)
print("Gas used: \(result.gasUsed)")
```

### Contract Deployment and Call
```swift
let evm = try await GuillotineEVM()

// Deploy contract
let deployResult = try await evm.deploy(
    bytecode: contractBytecode,
    from: deployer,
    value: .zero,
    gasLimit: 2_000_000
)

guard let contractAddress = deployResult.contractAddress else {
    throw ExecutionError.internalError("Deployment failed")
}

// Call contract
let callResult = try await evm.call(
    to: contractAddress,
    input: functionCallData,
    from: caller,
    gasLimit: 100_000
)

print("Return data: \(callResult.returnData)")
```

### State Management
```swift
let evm = try await GuillotineEVM()
let stateManager = try await MemoryStateManager()

// Set up accounts
try await stateManager.setBalance(alice, balance: .ether(10.0))
try await stateManager.setBalance(bob, balance: .ether(5.0))

// Execute transaction
let tx = Transaction(
    from: alice,
    to: bob,
    value: .ether(1.0),
    gasLimit: 21_000
)

let result = try await evm.executeTransaction(tx)
print("Transfer successful: \(result.success)")
```

This comprehensive API design provides:
- Full C API coverage with ergonomic Swift patterns
- Type safety and error handling
- Modern async/await concurrency
- Comprehensive result types
- Enhanced primitive types
- State management abstraction
- High-level convenience methods

The implementation will follow TDD principles with comprehensive test coverage.