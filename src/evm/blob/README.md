# Blob Transactions (EIP-4844)

Implementation of EIP-4844 "Proto-Danksharding" support, introducing blob-carrying transactions that provide temporary data availability for Layer 2 scaling solutions.

## Purpose

Blob transactions enable Ethereum to serve as a data availability layer for rollups by:
- Providing 128KB data blobs that are not accessible to EVM execution
- Creating a separate fee market for blob data to manage demand
- Using KZG polynomial commitments for efficient data verification
- Automatically pruning blob data after ~2 weeks to manage state growth

## Architecture

The blob subsystem consists of:
1. **Data Types**: Core structures for blobs, commitments, and proofs
2. **Gas Market**: Independent fee market targeting 3 blobs per block
3. **KZG Verification**: Cryptographic verification of blob commitments
4. **Integration**: Exports and conditional compilation for different targets

## Files

### `index.zig`
Module entry point that exports all blob-related functionality.

**Features**:
- Re-exports all types from submodules
- Conditionally selects KZG implementation based on target (WASM vs native)
- Provides unified interface for blob transaction support

**Used By**: Main EVM module when processing blob transactions

### `blob_types.zig`
Core data structures and constants for EIP-4844.

**Types**:
- `Blob`: 128KB data structure containing 4,096 field elements
- `FieldElement`: 32-byte BLS12-381 scalar field element (must be < BLS_MODULUS)
- `KZGCommitment`: 48-byte BLS12-381 G1 point representing polynomial commitment
- `KZGProof`: 48-byte BLS12-381 G1 point for polynomial evaluation proof
- `VersionedHash`: 32-byte hash with version prefix (0x01 for KZG)

**Constants**:
- `BYTES_PER_BLOB`: 131,072 (128KB)
- `FIELD_ELEMENTS_PER_BLOB`: 4,096
- `MAX_BLOBS_PER_TRANSACTION`: 6
- `GAS_PER_BLOB`: 131,072
- `BLS_MODULUS`: The BLS12-381 scalar field modulus

**Features**:
- Field element validation (ensures values < BLS_MODULUS)
- Versioned hash computation from commitments
- Field element extraction from blob data

**Used By**: All blob-related operations throughout the EVM

### `blob_gas_market.zig`
Independent gas market for blob data with exponential pricing.

**Key Components**:
- `BlobGasMarket`: Main market mechanism implementation
- `BlobGasMarketStats`: Monitoring and statistics

**Market Parameters**:
- **Target**: 3 blobs per block (393,216 gas)
- **Maximum**: 6 blobs per block (786,432 gas)
- **Minimum base fee**: 1 wei
- **Update fraction**: 3,338,477 (controls price adjustment rate)

**Functions**:
- `calculateBlobBaseFee()`: Computes base fee from excess blob gas
- `calculateExcessBlobGas()`: Updates excess gas after block
- `verifyBlobTransaction()`: Validates blob count and affordability
- `getBlobGas()`: Calculates total blob gas for transaction

**Formula**: `base_fee = e^(excess_blob_gas / UPDATE_FRACTION)`

**Performance**: Uses efficient integer approximation of exponential function

**Used By**: 
- Transaction validation before execution
- Block processing for gas updates
- Fee calculation for blob transactions

### `kzg_verification.zig`
Placeholder KZG verification for WASM builds.

**Purpose**: Provides KZG interface when c-kzg-4844 library is unavailable (WASM targets)

**Features**:
- Simulates verification without actual cryptographic operations
- Maintains same interface as real implementation
- Allows testing and development in WASM environments

**Note**: This implementation does NOT provide cryptographic security

**Used By**: Blob verification in WASM builds only

### `kzg_verification_real.zig`
Actual KZG cryptographic verification for native builds.

**Features**:
- `init()`: Loads trusted setup (requires valid KZG ceremony data)
- `deinit()`: Cleans up global KZG context
- `blobToKZGCommitment()`: Converts blob to polynomial commitment
- `verifyBlobKZGProof()`: Verifies blob matches its commitment
- `verifyKZGProof()`: Point evaluation proof for precompile

**Dependencies**: 
- c-kzg-4844 library via primitives module
- Trusted setup loaded from ethereum/c-kzg-4844

**Performance**: 
- Blob to commitment: ~1-2ms
- Blob verification: ~2-3ms
- Point evaluation: ~1ms

**Used By**:
- Transaction validation (blob proof verification)
- KZG point evaluation precompile
- Block validation

## Usage in EVM

1. **Transaction Validation**:
   - Check blob count doesn't exceed maximum
   - Verify user can afford blob gas fees
   - Validate all KZG proofs

2. **Execution**:
   - Blobs are NOT accessible during execution
   - Only versioned hashes available via BLOBHASH opcode
   - KZG point evaluation available via precompile

3. **Block Processing**:
   - Update excess blob gas based on usage
   - Calculate new blob base fee
   - Store blob data (pruned after ~2 weeks)

## Testing

The module includes tests for:
- Blob data validation
- Gas market mechanics and fee calculations
- KZG verification (both real and placeholder)
- Integration with transaction processing

## Security Considerations

- Field elements MUST be validated < BLS_MODULUS
- KZG verification is critical for blob integrity
- WASM builds use placeholder verification (not secure)
- Trusted setup must be from official KZG ceremony

## Performance Notes

- Blob verification is computationally expensive (~2-3ms)
- Gas market calculations use efficient integer math
- Blob data is write-once, read-never (except for serving to peers)
- Versioned hashes enable future cryptographic scheme upgrades