# Precompiled Contracts

Implementation of Ethereum's precompiled contracts - native code implementations of computationally intensive operations that would be prohibitively expensive as EVM bytecode.

## Purpose

Precompiled contracts provide:
- Native implementations of cryptographic operations
- Optimized mathematical computations
- Essential functionality at fixed addresses (0x01-0x0a)
- Gas-efficient alternatives to EVM bytecode
- Hardfork-gated feature additions

## Architecture

The precompiles system consists of:
1. **Dispatcher**: Routes calls to precompile implementations
2. **Implementations**: Individual precompile logic
3. **Gas Calculations**: Cost formulas for each operation
4. **Address Constants**: Well-known precompile addresses
5. **Result Types**: Standardized return structures

## Files

### `precompiles.zig`
Main entry point and dispatcher for all precompiled contracts.

**Key Function**:
```zig
pub fn executePrecompile(
    address: Address,
    input: []const u8,
    gas_limit: u64,
    chain_rules: ChainRules
) !PrecompileCallResult
```

**Dispatch Logic**:
1. Check if address is a precompile (0x01-0x0a)
2. Verify precompile is active in current hardfork
3. Calculate gas cost for operation
4. Execute precompile if sufficient gas
5. Return result or error

**Supported Precompiles**:
- 0x01: ECRECOVER
- 0x02: SHA256
- 0x03: RIPEMD160
- 0x04: IDENTITY
- 0x05: MODEXP
- 0x06: ECADD (BN254)
- 0x07: ECMUL (BN254)
- 0x08: ECPAIRING (BN254)
- 0x09: BLAKE2F
- 0x0a: KZG_POINT_EVALUATION

**Used By**: CALL, STATICCALL, DELEGATECALL operations

### `precompile_addresses.zig`
Well-known addresses for precompiled contracts.

**Constants**:
```zig
pub const ECRECOVER = 0x0000000000000000000000000000000000000001;
pub const SHA256 = 0x0000000000000000000000000000000000000002;
pub const RIPEMD160 = 0x0000000000000000000000000000000000000003;
pub const IDENTITY = 0x0000000000000000000000000000000000000004;
pub const MODEXP = 0x0000000000000000000000000000000000000005;
pub const ECADD = 0x0000000000000000000000000000000000000006;
pub const ECMUL = 0x0000000000000000000000000000000000000007;
pub const ECPAIRING = 0x0000000000000000000000000000000000000008;
pub const BLAKE2F = 0x0000000000000000000000000000000000000009;
pub const KZG_POINT_EVALUATION = 0x000000000000000000000000000000000000000a;
```

**Utilities**:
- `isPrecompile()`: Check if address is precompile
- `getPrecompileIndex()`: Convert address to index

**Used By**: Dispatcher, gas calculations

### `precompile_gas.zig`
Gas cost calculations for all precompiles.

**Cost Functions**:
- `ecrecoverGas()`: Fixed 3000 gas
- `sha256Gas()`: 60 + 12×(data_words)
- `ripemd160Gas()`: 600 + 120×(data_words)
- `identityGas()`: 15 + 3×(data_words)
- `modexpGas()`: Complex formula based on operand sizes
- `bn254AddGas()`: Fixed 150 gas (Istanbul: 500)
- `bn254MulGas()`: Fixed 6000 gas (Istanbul: 40000)
- `bn254PairingGas()`: 45000 + 34000×k (Istanbul: 100000 + 80000×k)
- `blake2fGas()`: 1×rounds
- `kzgPointEvaluationGas()`: Fixed 50000 gas

**Common Patterns**:
- Fixed base cost + linear data cost
- Word-based calculations (32-byte chunks)
- Hardfork-specific adjustments

**Used By**: Precompile dispatcher

### `precompile_result.zig`
Result types for precompile execution.

**Types**:
```zig
PrecompileCallResult = struct {
    gas_used: u64,        // Gas consumed
    output: []const u8,   // Result data
}

PrecompileError = error {
    // Validation errors
    InvalidInput,
    InvalidSignature,
    InvalidPoint,
    
    // Execution errors
    OutOfGas,
    AllocationError,
    
    // Specific errors per precompile
}
```

**Used By**: All precompile implementations

### Individual Precompile Implementations

#### `ecrecover.zig` (0x01)
Recovers Ethereum address from signature.

**Input**: 128 bytes
- [0:32]: hash
- [32:64]: v (recovery id)
- [64:96]: r (signature part)
- [96:128]: s (signature part)

**Output**: 32 bytes (address padded to 32 bytes)

**Gas**: 3000 (fixed)

**Available**: Frontier+

#### `sha256.zig` (0x02)
Computes SHA256 hash.

**Input**: Arbitrary length data

**Output**: 32 bytes (hash)

**Gas**: 60 + 12×ceil(len/32)

**Available**: Frontier+

#### `ripemd160.zig` (0x03)
Computes RIPEMD-160 hash.

**Input**: Arbitrary length data

**Output**: 32 bytes (20-byte hash padded)

**Gas**: 600 + 120×ceil(len/32)

**Available**: Frontier+

#### `identity.zig` (0x04)
Returns input data unchanged (memcpy).

**Input**: Arbitrary length data

**Output**: Same as input

**Gas**: 15 + 3×ceil(len/32)

**Available**: Frontier+

#### `modexp.zig` (0x05)
Modular exponentiation (base^exp % modulus).

**Input**: 
- [0:32]: base length
- [32:64]: exponent length
- [64:96]: modulus length
- [96:]: base || exponent || modulus

**Output**: Modulus-sized result

**Gas**: Complex formula based on operand sizes

**Available**: Byzantium+

#### `ecadd.zig` (0x06)
BN254 elliptic curve point addition.

**Input**: 128 bytes (two points)

**Output**: 64 bytes (result point)

**Gas**: 500 (Istanbul: 150)

**Available**: Byzantium+

#### `ecmul.zig` (0x07)
BN254 elliptic curve scalar multiplication.

**Input**: 96 bytes (point + scalar)

**Output**: 64 bytes (result point)

**Gas**: 40000 (Istanbul: 6000)

**Available**: Byzantium+

#### `ecpairing.zig` (0x08)
BN254 elliptic curve pairing check.

**Input**: k×192 bytes (k pairs of G1,G2 points)

**Output**: 32 bytes (1 for success, 0 for failure)

**Gas**: 100000 + 80000×k (Istanbul: 45000 + 34000×k)

**Available**: Byzantium+

#### `blake2f.zig` (0x09)
BLAKE2b compression function.

**Input**: 213 bytes
- [0:4]: rounds
- [4:68]: h (state)
- [68:196]: m (message)
- [196:212]: t (offset)
- [212]: f (final flag)

**Output**: 64 bytes (new state)

**Gas**: rounds

**Available**: Istanbul+

#### `kzg_point_evaluation.zig` (0x0a)
KZG polynomial commitment point evaluation.

**Input**: 192 bytes
- [0:32]: versioned hash
- [32:64]: z (evaluation point)
- [64:96]: y (claimed value)
- [96:144]: commitment
- [144:192]: proof

**Output**: 64 bytes (field elements)

**Gas**: 50000 (fixed)

**Available**: Cancun+

### Supporting Files

#### `ec_validation.zig`
Common elliptic curve validation logic.

**Functions**:
- Point validation
- Scalar range checks
- Coordinate normalization

**Used By**: ECRECOVER, BN254 precompiles

#### `bn254.zig` / `bn254_rust_wrapper.zig`
BN254 curve operations via Rust FFI.

**Features**:
- Optimized curve arithmetic
- Pairing computations
- FFI safety wrappers

**Used By**: ECADD, ECMUL, ECPAIRING

## Gas Calculation Patterns

### Linear with Data Size
```
gas = base_cost + per_word_cost × ceil(data_len / 32)
```
Used by: SHA256, RIPEMD160, IDENTITY

### Fixed Cost
```
gas = constant
```
Used by: ECRECOVER, KZG_POINT_EVALUATION

### Complex Formulas
MODEXP uses bit length and exponent analysis
BN254 operations scale with input count

## Error Handling

All precompiles use consistent error types:
- `InvalidInput`: Malformed input data
- `InvalidSignature`: Bad cryptographic data
- `OutOfGas`: Insufficient gas provided
- `InvalidPoint`: Invalid curve point

## Hardfork Availability

- **Frontier**: 0x01-0x04 (basic crypto + identity)
- **Byzantium**: 0x05-0x08 (modexp + BN254)
- **Istanbul**: 0x09 (BLAKE2F)
- **Cancun**: 0x0a (KZG)

## Testing

Each precompile includes:
- Test vectors from Ethereum tests
- Edge case validation
- Gas consumption tests
- Error condition tests

## Security Considerations

1. **Input Validation**: All inputs thoroughly validated
2. **Gas Pre-calculation**: Prevents DoS via gas exhaustion
3. **Cryptographic Safety**: Uses validated implementations
4. **No Side Effects**: Precompiles are pure functions
5. **Deterministic**: Same input always produces same output

## Performance Optimizations

- Native implementations (not EVM bytecode)
- Optimized cryptographic libraries
- Efficient memory handling
- Minimal allocations
- Gas costs reflect actual computation

## Adding New Precompiles

1. Define address in `precompile_addresses.zig`
2. Implement logic in new file
3. Add gas calculation to `precompile_gas.zig`
4. Update dispatcher in `precompiles.zig`
5. Add hardfork gate in chain rules
6. Write comprehensive tests

## Future Considerations

- Additional cryptographic primitives
- Zero-knowledge proof support
- Post-quantum signatures
- Cross-chain interoperability
- Optimized implementations