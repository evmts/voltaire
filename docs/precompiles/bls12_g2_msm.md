# BLS12_G2MSM (0x10)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000010`
- **Available since:** Prague (EIP-2537)
- **EIP:** [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 curve operations

## Purpose

Performs multi-scalar multiplication (MSM) on the BLS12-381 G2 group. Given G2 points P₁, ..., Pₙ and scalars k₁, ..., kₙ, computes k₁*P₁ + ... + kₙ*Pₙ. Critical for efficient BLS signature aggregation and batch verification when signatures or public keys are in G2.

## Audit Status

✅ AUDITED - Production Grade (BLST Library)

This implementation uses BLST, an audited, production-grade BLS12-381 library.

Library Details:
- Name: BLST (by Supranational)
- Version: 0.3.11+
- Audit Status: Audited by Trail of Bits (2021)
- Audit Report: https://github.com/supranational/blst#audits
- Security Level: ~128-bit security

Use Cases:
- Ethereum 2.0 consensus layer (BLS signatures)
- BLS signature aggregation and verification
- Zero-knowledge proof systems
- Pairing-based cryptography

Performance:
- Hardware-accelerated operations (x86-64, ARM)
- Constant-time execution (timing attack resistant)
- Production-optimized

Status: ✅ Safe for production use (battle-tested in Ethereum 2.0)

Note: This is significantly more secure than the pure Zig fallback implementations which are NOT audited.

## Gas Cost

**Dynamic with discount:**
- Base per-point: 22,500 (same as G2MUL)
- Discount applied based on number of points
- Formula: `(22,500 * k * discount) / 1000`
- Where discount(k) approaches floor of 524 for k ≥ 128

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

**Multiple of 288 bytes:** Each 288-byte chunk is one G2 point-scalar pair.

**Per Pair (288 bytes):**

| Offset | Length | Field  | Description |
|--------|--------|--------|-------------|
| 0      | 64     | x_c0   | X coordinate component 0 (Fp) |
| 64     | 64     | x_c1   | X coordinate component 1 (Fp) |
| 128    | 64     | y_c0   | Y coordinate component 0 (Fp) |
| 192    | 64     | y_c1   | Y coordinate component 1 (Fp) |
| 256    | 32     | scalar | Scalar multiplier (big-endian) |

**Constraints:**
- Input length must be non-zero and divisible by 288
- All points must be valid G2 points

## Output Format

Returns 256 bytes: the resulting G2 point.

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | x_c0  | X coordinate component 0 (Fp) |
| 64     | 64     | x_c1  | X coordinate component 1 (Fp) |
| 128    | 64     | y_c0  | Y coordinate component 0 (Fp) |
| 192    | 64     | y_c1  | Y coordinate component 1 (Fp) |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const bls12_g2_msm = precompiles.bls12_g2_msm;

// Compute MSM with 2 G2 point-scalar pairs
var input: [576]u8 = undefined; // 2 * 288 = 576 bytes

// First pair
@memcpy(input[0..64], &point1_x_c0);
@memcpy(input[64..128], &point1_x_c1);
@memcpy(input[128..192], &point1_y_c0);
@memcpy(input[192..256], &point1_y_c1);
@memcpy(input[256..288], &scalar1);

// Second pair
@memcpy(input[288..352], &point2_x_c0);
@memcpy(input[352..416], &point2_x_c1);
@memcpy(input[416..480], &point2_y_c0);
@memcpy(input[480..544], &point2_y_c1);
@memcpy(input[544..576], &scalar2);

const result = try bls12_g2_msm.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Result = scalar1*point1 + scalar2*point2
```

## Implementation Details

1. **Input Validation:**
   - Length must be non-zero
   - Length must be divisible by 288
   - All points must be valid G2 points

2. **Gas Calculation:**
   - Number of pairs: `k = input.len / 288`
   - Discount factor from `utils.msmDiscount(k)`
   - Gas cost: `(45,000 * k * discount) / 1000`

3. **MSM Computation:**
   - Uses BLST library via `crypto.Crypto.bls12_381.g2Msm()`
   - Optimized Pippenger's algorithm in Fp²
   - More efficient than k separate G2MUL operations

## Discount Table (EIP-2537)

Same discount structure as G1MSM:

| Pairs (k) | Discount | Effective Cost per Pair |
|-----------|----------|-------------------------|
| 1         | 1000     | 45,000 gas             |
| 2         | 820      | 36,900 gas             |
| 4         | 580      | 26,100 gas             |
| 8         | 430      | 19,350 gas             |
| 16        | 320      | 14,400 gas             |
| 32        | 250      | 11,250 gas             |
| 64        | 200      | 9,000 gas              |
| 128+      | 174      | 7,830 gas              |

**Example Gas Costs:**
- 1 pair: 45,000 gas
- 2 pairs: 73,800 gas
- 4 pairs: 104,400 gas
- 10 pairs: 193,500 gas

## Error Conditions

- **InvalidInput:** Input length is zero or not divisible by 288
- **InvalidPoint:** One or more G2 points are invalid
- **OutOfGas:** Insufficient gas for the operation

## Use Cases

1. **BLS Signature Aggregation:** Batch verify aggregated signatures
2. **Public Key Aggregation:** Combine multiple public keys
3. **Threshold Signatures:** Reconstruct threshold signatures
4. **Multi-Signature Schemes:** Efficient multi-sig verification

## Testing Considerations

Test cases should include:
- Single pair (equivalent to G2MUL)
- Multiple pairs (2, 4, 8)
- All zeros result
- Mixed valid and infinity points
- Invalid input lengths
- Invalid G2 points
- Gas calculation accuracy
- Discount table verification

## Performance Notes

- Significantly more efficient than separate operations
- Discount rewards batching
- Pippenger's algorithm provides sub-linear scaling
- Most efficient for large batches (32+ pairs)

## Discount Floor

Per EIP-2537, the discount factor has a floor:
- Discount approaches **524** for very large k (≥128 points)
- This prevents gas cost from becoming too cheap
- Formula: `max(discount_table[k], 524)` for G2 MSM

## Comparison: Individual vs Batched

Computing k₁*P₁ + k₂*P₂ + ... + kₙ*Pₙ in G2:

**Without MSM (n=4):**
- 4 G2MUL: 4 × 45,000 = 180,000 gas
- 3 G2ADD: 3 × 800 = 2,400 gas
- Total: 182,400 gas

**With G2MSM (n=4):**
- 1 G2MSM: ~104,400 gas
- **Savings: ~43% reduction**

## G1MSM vs G2MSM Comparison

| Feature          | G1MSM (0x0D) | G2MSM (0x10) |
|------------------|--------------|--------------|
| Field            | Fp           | Fp²          |
| Pair size        | 160 bytes    | 288 bytes    |
| Base gas         | 12,000       | 45,000       |
| Output size      | 128 bytes    | 256 bytes    |
| Cost ratio       | 1×           | 3.75×        |

## BLS Signature Context

**Typical MSM usage:**
- Aggregate signature verification
- Multi-signature schemes
- Threshold signature reconstruction
- Distributed key generation

## Security Notes

- **Constant-Time:** Must not leak scalar information
- **Point Validation:** All G2 points must be validated
- **Batch Verification:** Failure in batch doesn't indicate which signature failed
- **BLST Library:** Production-grade implementation

## Related Precompiles

- **BLS12_G2ADD (0x0E):** Single addition in G2
- **BLS12_G2MUL (0x0F):** Single scalar multiplication in G2
- **BLS12_G1MSM (0x0D):** MSM in G1 group
- **BLS12_PAIRING (0x11):** Pairing operations
