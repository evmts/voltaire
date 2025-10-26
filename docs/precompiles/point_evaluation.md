# POINT_EVALUATION (0x0A)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x000000000000000000000000000000000000000A`
- **Available since:** Cancun (EIP-4844)
- **EIP:** [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) - Shard Blob Transactions

## Purpose

Verifies KZG (Kate-Zaverucha-Goldberg) polynomial commitments for EIP-4844 blob transactions. This precompile is essential for Ethereum's proto-danksharding, enabling data availability sampling and significantly reducing Layer 2 rollup costs. It verifies that a KZG commitment correctly evaluates to a claimed value at a specific point.

## Audit Status

✅ AUDITED - Ethereum Foundation Library

This implementation uses c-kzg-4844, the official Ethereum Foundation reference implementation.

Library Details:
- Name: c-kzg-4844
- Maintainer: Ethereum Foundation
- Audit Status: Audited as part of EIP-4844 implementation
- Purpose: Blob transaction verification (EIP-4844)
- Trusted Setup: Uses Powers of Tau ceremony (community verified)

Security:
- Production-ready for Ethereum mainnet
- Critical for EIP-4844 blob data availability
- Used by all Ethereum clients

Audit Information:
- Part of Ethereum Dencun (Cancun-Deneb) upgrade audit process
- Verified by multiple client teams

Status: ✅ Safe for production use

## Gas Cost

**Constant:** 50,000 gas

This cost reflects the expensive pairing operations required for KZG verification.

## API Reference

### Function Signature

```zig
pub fn execute(
    allocator: std.mem.Allocator,
    input: []const u8,
    gas_limit: u64,
) PrecompileError!PrecompileResult
```

## Input Format

**Exactly 192 bytes required:**

| Offset | Length | Field           | Description |
|--------|--------|-----------------|-------------|
| 0      | 32     | versioned_hash  | Commitment hash with version byte |
| 32     | 32     | z               | Evaluation point (big-endian) |
| 64     | 32     | y               | Claimed evaluation value (big-endian) |
| 96     | 48     | commitment      | KZG commitment (BLS12-381 G1 point) |
| 144    | 48     | proof           | KZG proof (BLS12-381 G1 point) |

## Output Format

Returns 64 bytes on successful verification, all zeros on failure:

| Offset | Length | Field                 | Description |
|--------|--------|-----------------------|-------------|
| 0      | 32     | FIELD_ELEMENTS_PER_BLOB | 0x1000 (4096 in decimal) or zeros |
| 32     | 32     | BLS_MODULUS           | BLS12-381 field modulus or zeros |

**Success Output:**
- Bytes 0-29: 0x00...00
- Bytes 30-31: 0x10 0x00 (FIELD_ELEMENTS_PER_BLOB = 4096)
- Bytes 32-63: 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001 (BLS_MODULUS)

**Failure Output:**
- All 64 bytes are zeros

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const crypto = @import("crypto");
const point_evaluation = precompiles.point_evaluation;

// Prepare 192-byte input for KZG verification
var input: [192]u8 = undefined;

// Compute versioned hash from commitment
var hash: [32]u8 = undefined;
try crypto.keccak_asm.keccak256(commitment_bytes, &hash);
hash[0] = 0x01; // EIP-4844 version byte
@memcpy(input[0..32], &hash);

// Set evaluation point z
@memcpy(input[32..64], &z_value);

// Set claimed evaluation y
@memcpy(input[64..96], &y_value);

// Set KZG commitment (48 bytes)
@memcpy(input[96..144], commitment_bytes);

// Set KZG proof (48 bytes)
@memcpy(input[144..192], proof_bytes);

const result = try point_evaluation.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Check if verification succeeded
const succeeded = (result.output[31] == 0x00 and
                   result.output[30] == 0x10);
```

## Implementation Details

1. **Input Validation:**
   - Length must be exactly 192 bytes
   - Versioned hash must match Keccak256(commitment) with version byte 0x01

2. **Versioned Hash Verification:**
   - Compute: `hash = Keccak256(commitment)`
   - Set version byte: `hash[0] = 0x01`
   - Compare with provided `versioned_hash`
   - Return error if mismatch

3. **KZG Proof Verification:**
   - Uses c-kzg-4844 trusted setup
   - Verifies: `commitment(z) = y` using the proof
   - Thread-safe verification via `kzg_setup.verifyKZGProofThreadSafe()`

4. **Output Generation:**
   - On success: Return FIELD_ELEMENTS_PER_BLOB and BLS_MODULUS
   - On failure: Return 64 zero bytes

## Error Conditions

- **InvalidInput:** Input length is not 192 bytes
- **InvalidInput:** Versioned hash doesn't match commitment
- **InvalidInput:** Invalid KZG commitment or proof format
- **InvalidInput:** KZG verification fails
- **OutOfGas:** Insufficient gas (< 50,000)

## KZG Commitment Details

**Trusted Setup:**
- Uses Powers of Tau ceremony
- 4096 field elements per blob
- BLS12-381 curve arithmetic

**BLS12-381 Field Modulus:**
```
0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001
```

**Field Elements Per Blob:**
- 4096 (0x1000)
- Each element is 32 bytes
- Total blob size: ~128 KB

## Use Cases

1. **Blob Transactions:** EIP-4844 shard blob transactions
2. **Layer 2 Rollups:** Cheap data availability for rollups
3. **Data Availability Sampling:** Enabling sharding
4. **Cost Reduction:** Drastically lower L2 transaction fees

## Testing Considerations

Test cases should include:
- Valid proof with point at infinity
- Valid proof with real commitment
- Invalid proof (should return zeros)
- Versioned hash mismatch
- Invalid input length (< 192, > 192, 0)
- Invalid commitment format
- Invalid proof format
- Out of gas scenarios
- Gas usage consistency (always 50,000)
- Output format validation

## Example Test Vectors (from EIP-4844)

**Test Case: Point at Infinity**
```
Commitment: 0xc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
Z: 0x0000000000000000000000000000000000000000000000000000000000000000
Y: 0x0000000000000000000000000000000000000000000000000000000000000000
Proof: 0xc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
Expected: Success (non-zero output)
```

## Performance Notes

- Constant 50,000 gas regardless of input
- Expensive due to BLS12-381 pairing operations
- Thread-safe implementation
- Uses optimized c-kzg-4844 library

## Security Notes

- **Trusted Setup:** Relies on Powers of Tau ceremony
- **Version Byte:** Must be 0x01 for EIP-4844
- **Hash Verification:** Critical to prevent commitment substitution
- **Point Validation:** Ensures points are on BLS12-381 curve
- **Constant Time:** Verification time independent of success/failure

## Comparison with Other Precompiles

| Feature      | POINT_EVALUATION | BN254PAIRING |
|--------------|------------------|--------------|
| Curve        | BLS12-381        | BN254        |
| Purpose      | Blob DA          | zkSNARKs     |
| Gas (base)   | 50,000           | 45,000       |
| Input size   | 192 bytes fixed  | 192n bytes   |
| Output       | 64 bytes         | 32 bytes     |

## Related Precompiles

- **BLS12_PAIRING (0x11):** BLS12-381 pairing for other use cases
- **BN254PAIRING (0x08):** Alternative curve for zkSNARKs

## EIP-4844 Context

This precompile is part of proto-danksharding:
- Introduces blob-carrying transactions
- Blobs are ~128 KB of data
- Available for rollups but not accessible to EVM
- Automatically pruned after ~18 days
- Significantly cheaper than CALLDATA
