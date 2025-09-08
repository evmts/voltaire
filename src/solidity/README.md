# Solidity Test Contracts

Solidity contracts and compiled bytecode used by tests and demos.

## Overview

The solidity module provides an extensive suite of test contracts that cover the full spectrum of EVM functionality, from basic operations to complex edge cases. These contracts are essential for validating EVM correctness, measuring performance, and ensuring compatibility with Ethereum standards.

## Components

### Test Contract Categories

- **`TestContracts.sol`** - Fundamental EVM testing contracts
- **`AdvancedTestContracts.sol`** - Complex scenarios and advanced features
- **`ErrorHandlingContracts.sol`** - Error conditions and exception testing
- **`DataStructureContracts.sol`** - Complex data structure operations
- **`InheritanceContracts.sol`** - Contract inheritance and polymorphism testing

### Benchmark Contracts

- **`SnailShellBenchmark.sol`** - Performance benchmark for computational intensity
- **`TenThousandHashesBenchmark.sol`** - Cryptographic operation benchmarking

### Bytecode Resources

- `erc20_bytecode.hex` — ERC‑20 contract bytecode (hex)
- `erc20_bytecode.txt` — ERC‑20 bytecode (alt format)
- `erc20_mint_bytecode.txt` — ERC‑20 mint function bytecode

### Test Integration

- **`snail_shell_benchmark_test.zig`** - Zig integration tests for benchmark contracts

## Features

### EVM Coverage

- Arithmetic, memory, storage, call/create paths
- Error handling (revert/invalid/oog), stack edge cases
- Cryptographic and precompile integrations

### Error Testing

- **Revert conditions** - Custom revert messages and error propagation
- **Out-of-gas scenarios** - Gas limit testing and consumption patterns
- **Invalid operations** - Invalid opcodes and illegal state transitions
- **Stack operations** - Stack overflow and underflow conditions
- **Jump validation** - Invalid jump destinations and malformed bytecode

### Performance Benchmarking

- **Computational benchmarks** - CPU-intensive operations for performance measurement
- **Memory benchmarks** - Large memory allocations and access patterns
- **Storage benchmarks** - Cold/warm storage access optimization testing
- **Cryptographic benchmarks** - Hash function and signature verification performance

### Real-world Scenarios

- **ERC-20 implementation** - Complete token contract with all standard functions
- **Complex inheritance** - Multi-level inheritance with virtual functions
- **Event emission** - Comprehensive logging and event testing
- **Precompile usage** - Integration with Ethereum precompiled contracts

## Contract Descriptions

### SimpleStorage

Basic contract for fundamental EVM testing:

```solidity
contract SimpleStorage {
    uint256 public value;
    mapping(address => uint256) public balances;
    
    function setValue(uint256 _value) external;
    function setBalance(address account, uint256 balance) external;
    function add(uint256 a, uint256 b) external pure returns (uint256);
    function revertWithMessage() external pure;
}
```

**Features:**
- Basic storage operations
- Mapping functionality
- Pure function testing
- Event emission
- Controlled revert conditions

### ArithmeticTester

Comprehensive arithmetic operation testing:

```solidity
contract ArithmeticTester {
    function addOverflow(uint256 a, uint256 b) external pure returns (uint256);
    function subUnderflow(uint256 a, uint256 b) external pure returns (uint256);
    function mulOverflow(uint256 a, uint256 b) external pure returns (uint256);
    function divByZero(uint256 a) external pure returns (uint256);
    function modByZero(uint256 a) external pure returns (uint256);
}
```

**Features:**
- Unchecked arithmetic operations
- Overflow and underflow scenarios
- Division by zero testing
- Modulo by zero testing
- Edge case validation

### MemoryTester

Memory operation and expansion testing:

```solidity
contract MemoryTester {
    function memoryExpansion() external pure returns (bytes memory);
    function largeCopy() external pure returns (bytes memory);
    function memoryPattern(uint256 size, uint8 pattern) external pure returns (bytes memory);
}
```

**Features:**
- Dynamic memory allocation
- Large memory copy operations
- Memory expansion cost testing
- Pattern-based memory operations
- Assembly-level memory manipulation

### CallTester

Comprehensive call operation testing:

```solidity
contract CallTester {
    function externalCall(address target, bytes calldata data) external returns (bool, bytes memory);
    function delegateCall(address target, bytes calldata data) external returns (bool, bytes memory);
    function staticCall(address target, bytes calldata data) external view returns (bool, bytes memory);
    function callWithValue(address target, uint256 value, bytes calldata data) external payable returns (bool, bytes memory);
    function recursiveCall(uint256 depth) external returns (uint256);
}
```

**Features:**
- All call types (CALL, DELEGATECALL, STATICCALL)
- Value transfer testing
- Recursive call patterns
- Call depth limitations
- Return data handling

### CreateTester

Contract creation testing:

```solidity
contract CreateTester {
    function createSimple() external returns (address);
    function createWithSalt(bytes32 salt) external returns (address);
    function createAndTest() external returns (uint256);
    function createFailing() external returns (address);
}
```

**Features:**
- CREATE opcode testing
- CREATE2 with salt
- Creation failure scenarios
- Post-creation interaction
- Gas cost analysis

### PrecompileTester

Ethereum precompiled contract testing:

```solidity
contract PrecompileTester {
    function testSha256(bytes calldata data) external view returns (bytes32);
    function testRipemd160(bytes calldata data) external view returns (bytes20);
    function testIdentity(bytes calldata data) external pure returns (bytes memory);
    function testEcrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) external pure returns (address);
    function testModExp(bytes calldata data) external view returns (bytes memory);
}
```

**Features:**
- All Ethereum precompiles (0x01-0x09)
- Cryptographic function validation
- Performance benchmarking
- Error condition testing
- Gas cost verification

### GasTester

Gas consumption pattern testing:

```solidity
contract GasTester {
    function storageTest(uint256 key, uint256 value) external;
    function storageWarmup(uint256[] calldata keys) external view returns (uint256);
    function memoryExpansionCost(uint256 size) external pure returns (uint256);
    function computeIntensive(uint256 iterations) external pure returns (uint256);
    function nestedCalls(uint256 depth) external view returns (uint256);
}
```

**Features:**
- Storage gas cost analysis
- Cold vs warm storage access
- Memory expansion cost measurement
- Computational gas consumption
- Call depth gas costs

### EdgeCaseTester

Edge cases and error conditions:

```solidity
contract EdgeCaseTester {
    function invalidOpcode() external pure;
    function outOfGas() external pure;
    function stackOverflow() external pure returns (uint256);
    function jumpToInvalidDestination() external pure;
    function accessInvalidMemory() external pure returns (bytes32);
}
```

**Features:**
- Invalid opcode execution
- Out-of-gas conditions
- Stack overflow scenarios
- Invalid jump destinations
- Memory access violations

## Benchmark Contracts

Benchmarks have been moved to a separate repository; the Solidity sources remain for reference.

- **Purpose**: Measure computational performance
- **Operations**: Nested loops, arithmetic operations
- **Metrics**: Instructions per second, gas efficiency
- **Use case**: Performance regression testing

### TenThousandHashesBenchmark

Cryptographic operation benchmark:

- **Purpose**: Hash function performance measurement
- **Operations**: Repeated Keccak-256 hashing
- **Metrics**: Hash operations per second
- **Use case**: Cryptographic performance validation

## Usage Examples

### Testing Basic Functionality

```solidity
// Deploy SimpleStorage with initial value
SimpleStorage storage = new SimpleStorage(42);

// Test value setting
storage.setValue(100);
assert(storage.value() == 100);

// Test mapping operations
storage.setBalance(msg.sender, 1000);
assert(storage.getBalance(msg.sender) == 1000);

// Test arithmetic
uint256 result = storage.add(10, 20);
assert(result == 30);
```

### Performance Benchmarking

```solidity
// Deploy benchmark contract
SnailShellBenchmark benchmark = new SnailShellBenchmark();

// Measure execution time
uint256 startGas = gasleft();
benchmark.computeIntensive(10000);
uint256 gasUsed = startGas - gasleft();

// Analyze performance
console.log("Gas consumed:", gasUsed);
```

### Error Testing

```solidity
// Test revert conditions
try storage.revertWithMessage() {
    assert(false); // Should not reach here
} catch Error(string memory reason) {
    assert(keccak256(bytes(reason)) == keccak256("Custom revert message"));
}

// Test arithmetic edge cases
ArithmeticTester arith = new ArithmeticTester();
uint256 result = arith.addOverflow(type(uint256).max, 1);
assert(result == 0); // Wraps around due to unchecked
```

## Important Considerations

### Gas Optimization

- **Efficient patterns** - Contracts demonstrate gas-efficient coding patterns
- **Cost measurement** - Precise gas cost measurement for various operations
- **Optimization validation** - Verify EVM optimizations don't break functionality
- **Regression testing** - Detect performance regressions in EVM implementations

### Security Testing

- **Reentrancy protection** - Test reentrancy attack vectors
- **Integer overflow** - Validate overflow/underflow handling
- **Access control** - Test permission and authorization mechanisms
- **State consistency** - Ensure consistent state across complex operations

### Compatibility Testing

- **Hardfork compatibility** - Test behavior across different Ethereum hardforks
- **Standard compliance** - Validate compliance with ERC standards
- **Cross-client compatibility** - Ensure consistent behavior across EVM implementations
- **Edge case handling** - Test unusual but valid scenarios

### Development Workflow

1. **Contract compilation** - Compile contracts to bytecode for testing
2. **Deployment testing** - Test contract deployment scenarios
3. **Function testing** - Execute individual functions with various inputs
4. **Integration testing** - Test contract interactions and composability
5. **Performance analysis** - Measure and analyze execution performance
6. **Regression testing** - Validate continued compatibility with changes

## Validation and Testing

These contracts serve multiple purposes in EVM development:

- **Correctness validation** - Ensure EVM implementations produce correct results
- **Performance benchmarking** - Measure and compare EVM execution performance
- **Regression testing** - Detect regressions in EVM implementations
- **Compatibility testing** - Validate compatibility across different EVM versions
- **Security testing** - Test security-critical operations and edge cases

The Solidity test contracts provide a comprehensive foundation for validating EVM implementations, ensuring correctness, performance, and compatibility with Ethereum standards while covering the full spectrum of EVM functionality and edge cases.
