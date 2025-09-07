# Test Fixtures

This directory contains comprehensive test fixtures for various categories of EVM testing. Each fixture provides bytecode, calldata, and additional metadata needed for thorough testing of the Guillotine EVM implementation.

## Directory Structure

### Opcodes Testing (`opcodes-*`)

Systematic testing of individual EVM opcodes organized by functional category:

#### Arithmetic Operations
- `opcodes-arithmetic/` - Basic arithmetic: ADD, MUL, SUB, DIV, MOD
- `opcodes-arithmetic-advanced/` - Advanced arithmetic: ADDMOD, MULMOD, EXP, SIGNEXTEND

#### Bitwise Operations
- `opcodes-bitwise/` - Bitwise operations: AND, OR, XOR, NOT, BYTE, SHL, SHR, SAR

#### Comparison Operations
- `opcodes-comparison/` - Comparison opcodes: LT, GT, SLT, SGT, EQ, ISZERO

#### Stack Operations
- `opcodes-push-pop/` - PUSH1-PUSH32, POP operations
- `opcodes-dup/` - DUP1-DUP16 operations
- `opcodes-swap/` - SWAP1-SWAP16 operations

#### Memory Operations
- `opcodes-memory/` - MLOAD, MSTORE, MSTORE8, MSIZE operations

#### Storage Operations
- `opcodes-storage-cold/` - SLOAD, SSTORE operations (cold storage access)
- `opcodes-storage-warm/` - SLOAD, SSTORE operations (warm storage access)

#### Control Flow
- `opcodes-control/` - Control flow: STOP, RETURN, REVERT, INVALID
- `opcodes-jump-basic/` - Jump operations: JUMP, JUMPI, JUMPDEST

#### Environmental Information
- `opcodes-environmental-1/` - ADDRESS, BALANCE, ORIGIN, CALLER, CALLVALUE
- `opcodes-environmental-2/` - CALLDATALOAD, CALLDATASIZE, CALLDATACOPY, CODESIZE, CODECOPY
- `opcodes-context/` - Transaction context opcodes
- `opcodes-block-1/` - Block information: BLOCKHASH, COINBASE, TIMESTAMP
- `opcodes-block-2/` - Block information: NUMBER, DIFFICULTY, GASLIMIT

#### Cryptographic Operations  
- `opcodes-crypto/` - KECCAK256 and other cryptographic operations
- `opcodes-data/` - Data handling operations

#### Logging Operations
- `opcodes-log/` - LOG0, LOG1, LOG2, LOG3, LOG4 operations

#### System Operations
- `opcodes-system/` - CREATE, CALL, CALLCODE, DELEGATECALL, STATICCALL, SELFDESTRUCT

### Precompiles Testing (`precompile-*`)

Testing of all Ethereum precompiled contracts:

- `precompile-ecrecover/` - Address 0x01: Elliptic curve signature recovery
- `precompile-sha256/` - Address 0x02: SHA-256 hash function
- `precompile-ripemd160/` - Address 0x03: RIPEMD-160 hash function
- `precompile-identity/` - Address 0x04: Identity function (data copy)
- `precompile-modexp/` - Address 0x05: Modular exponentiation
- `precompile-bn256add/` - Address 0x06: BN256 elliptic curve addition
- `precompile-bn256mul/` - Address 0x07: BN256 elliptic curve scalar multiplication  
- `precompile-bn256pairing/` - Address 0x08: BN256 pairing check
- `precompile-blake2f/` - Address 0x09: BLAKE2F compression function
- `precompile-pointevaluation/` - Address 0x0A: Point evaluation (KZG)

### Smart Contract Testing

#### ERC-20 Token Operations
- `erc20-transfer/` - Standard ERC-20 token transfer
- `erc20-mint/` - ERC-20 token minting operations
- `erc20-approval-transfer/` - ERC-20 approval and transferFrom flow

#### DeFi Protocol Testing
- `aave-v3-pool/` - AAVE V3 lending pool contract
- `compound-cusdc/` - Compound cUSDC money market
- `uniswap-v2-router/` - Uniswap V2 router contract
- `uniswap-v3-pool-eth-usdc/` - Uniswap V3 ETH/USDC pool
- `usdc-proxy/` - USDC proxy contract implementation
- `weth-mainnet/` - Wrapped Ether (WETH) mainnet contract

### Performance Testing
- `ten-thousand-hashes/` - Intensive hash computation benchmark
- `snailtracer/` - Complex execution tracing benchmark

## Fixture Format

Each fixture directory contains standardized files:

### Basic Fixture Structure
```
fixture-name/
├── bytecode.txt     # Contract bytecode (hex-encoded)
└── calldata.txt     # Input calldata (hex-encoded, may be empty)
```

### Extended Contract Structure  
```
contract-name/
├── address.txt      # Contract address (for mainnet contracts)
├── bytecode.txt     # Contract bytecode
├── calldata.txt     # Input calldata  
└── contract.abi.zon # Contract ABI in Zig Object Notation format
```

### File Contents

- **`bytecode.txt`** - Hex-encoded EVM bytecode without `0x` prefix
- **`calldata.txt`** - Hex-encoded calldata with `0x` prefix (or empty `0x`)
- **`address.txt`** - Ethereum address with `0x` prefix (for deployed contracts)
- **`contract.abi.zon`** - Contract ABI in Zig Object Notation for type-safe interaction

## Using Fixtures in Tests

### Basic Fixture Usage

```zig
const std = @import("std");

test "arithmetic opcodes" {
    const bytecode = @embedFile("fixtures/opcodes-arithmetic/bytecode.txt");
    const calldata = @embedFile("fixtures/opcodes-arithmetic/calldata.txt");
    
    // Initialize EVM with fixture data
    var evm = try Evm.init(allocator);
    defer evm.deinit();
    
    // Execute with fixture bytecode and calldata
    const result = try evm.execute(bytecode, calldata);
    
    // Verify expected behavior
    try std.testing.expect(result.success);
}
```

### Contract Fixture Usage

```zig
const popular_contracts = @import("fixtures/popular_contracts.zig");

test "WETH contract interaction" {
    const weth = popular_contracts.FixtureContract.get(.weth_mainnet);
    
    // Use contract address, bytecode, and ABI
    try std.testing.expect(weth.address.equals(
        Address.from_hex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2") catch unreachable
    ));
    
    // Access contract ABI for function calls
    const deposit_fn = findFunction(weth.abi, "deposit");
    // ... construct calldata and test
}
```

### Precompile Testing

```zig
test "SHA-256 precompile" {
    const bytecode = @embedFile("fixtures/precompile-sha256/bytecode.txt");
    const calldata = @embedFile("fixtures/precompile-sha256/calldata.txt");
    
    var evm = try Evm.init(allocator);
    defer evm.deinit();
    
    const result = try evm.execute(bytecode, calldata);
    
    // Verify SHA-256 computation correctness
    try std.testing.expectEqualSlices(u8, expected_hash, result.output);
}
```

## Adding New Fixtures

### 1. Create Fixture Directory

```bash
mkdir src/_test_utils/fixtures/my-new-fixture
```

### 2. Add Required Files

```bash
# Required: Contract bytecode (hex without 0x prefix)
echo "6080604052..." > bytecode.txt

# Required: Calldata (hex with 0x prefix, or empty 0x)
echo "0x" > calldata.txt

# Optional: Contract address (for mainnet contracts)
echo "0x742d35Cc6634C0532925a3b8D" > address.txt

# Optional: ABI file (for contract interactions)
# Create contract.abi.zon with proper Zig Object Notation format
```

### 3. Update Popular Contracts (if needed)

For reusable contracts, add to `popular_contracts.zig`:

```zig
// Add to ContractName enum
pub const ContractName = enum {
    // ... existing contracts
    my_new_contract,
};

// Add fixture definition
const my_new_contract_fixture = FixtureContract{
    .address = Address.from_hex("0x...") catch unreachable,
    .bytecode = @embedFile("my-new-fixture/bytecode.txt"),
    .abi = convertZonAbi(@import("my-new-fixture/contract.abi.zon")),
};

// Add to switch statement in get() method
```

### 4. Create Tests

Add corresponding test files that utilize the new fixtures following the established patterns.

## Fixture Categories

### Testing Coverage Matrix

| Category | Purpose | Fixture Count | Coverage |
|----------|---------|---------------|----------|
| Opcodes | Individual opcode behavior | 20+ | Complete EVM instruction set |
| Precompiles | Cryptographic functions | 10 | All Ethereum precompiles |
| Contracts | Real-world contract behavior | 6 | Popular DeFi protocols |
| Performance | Stress testing | 3 | Hash-intensive workloads |

### Maintenance

- Fixtures are static and should not be modified unless the underlying contracts change
- New opcodes or precompiles require corresponding fixture additions
- Contract fixtures should represent real mainnet deployments when possible
- Performance fixtures should stress different aspects of the EVM (computation, memory, storage)

This fixture collection ensures comprehensive testing coverage across all aspects of EVM execution, from individual opcodes to complex DeFi protocol interactions.