# BLS12_G1MSM (0x0D)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x000000000000000000000000000000000000000D`
- **Available since:** Prague (EIP-2537)
- **EIP:** [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 curve operations

## Purpose

Performs multi-scalar multiplication (MSM) on the BLS12-381 G1 group. Given points P₁, P₂, ..., Pₙ and scalars k₁, k₂, ..., kₙ, computes k₁*P₁ + k₂*P₂ + ... + kₙ*Pₙ. This operation is critical for efficient zero-knowledge proof verification and signature aggregation, offering significant gas savings compared to individual multiplications and additions.

## Gas Cost

**Dynamic with discount:**
- Base per-point: 12,000 (same as G1MUL)
- Discount applied based on number of points
- Formula: `(12,000 * k * discount) / 1000`
- Where discount(k) approaches floor of 519 for k ≥ 128

The discount rewards batching multiple operations together.

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

**Multiple of 160 bytes:** Each 160-byte chunk is one point-scalar pair.

**Per Pair (160 bytes):**

| Offset | Length | Field  | Description |
|--------|--------|--------|-------------|
| 0      | 64     | x      | X coordinate of G1 point (big-endian Fp) |
| 64     | 64     | y      | Y coordinate of G1 point (big-endian Fp) |
| 128    | 32     | scalar | Scalar multiplier (big-endian) |

**Constraints:**
- Input length must be non-zero and divisible by 160
- All points must be valid G1 points

## Output Format

Returns 128 bytes: the resulting G1 point.

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | x     | X coordinate of result point (big-endian Fp) |
| 64     | 64     | y     | Y coordinate of result point (big-endian Fp) |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const bls12_g1_msm = precompiles.bls12_g1_msm;

// Compute MSM with 3 point-scalar pairs
var input: [480]u8 = undefined; // 3 * 160 = 480 bytes

// First pair
@memcpy(input[0..64], &point1_x);
@memcpy(input[64..128], &point1_y);
@memcpy(input[128..160], &scalar1);

// Second pair
@memcpy(input[160..224], &point2_x);
@memcpy(input[224..288], &point2_y);
@memcpy(input[288..320], &scalar2);

// Third pair
@memcpy(input[320..384], &point3_x);
@memcpy(input[384..448], &point3_y);
@memcpy(input[448..480], &scalar3);

const result = try bls12_g1_msm.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Result = scalar1*point1 + scalar2*point2 + scalar3*point3
```

## Implementation Details

1. **Input Validation:**
   - Length must be non-zero
   - Length must be divisible by 160
   - All points must be valid G1 points

2. **Gas Calculation:**
   - Number of pairs: `k = input.len / 160`
   - Discount factor from `utils.msmDiscount(k)`
   - Gas cost: `(12,000 * k * discount) / 1000`

3. **MSM Computation:**
   - Uses BLST library via `crypto.Crypto.bls12_381.g1Msm()`
   - Optimized Pippenger's algorithm
   - More efficient than k separate multiplications

## Discount Table (EIP-2537)

| Pairs (k) | Discount | Effective Cost per Pair |
|-----------|----------|-------------------------|
| 1         | 1000     | 12,000 gas             |
| 2         | 820      | 9,840 gas              |
| 4         | 580      | 6,960 gas              |
| 8         | 430      | 5,160 gas              |
| 16        | 320      | 3,840 gas              |
| 32        | 250      | 3,000 gas              |
| 64        | 200      | 2,400 gas              |
| 128+      | 174      | 2,088 gas              |

**Example Gas Costs:**
- 1 pair: 12,000 gas
- 2 pairs: 19,680 gas (9,840 each)
- 4 pairs: 27,840 gas (6,960 each)
- 10 pairs: 51,600 gas (5,160 each)

## Error Conditions

- **InvalidInput:** Input length is zero or not divisible by 160
- **InvalidPoint:** One or more points are not on the curve
- **OutOfGas:** Insufficient gas for the operation

## Use Cases

1. **Zero-Knowledge Proofs:** Efficient proof verification (Groth16, PLONK)
2. **BLS Signature Aggregation:** Batch verification of signatures
3. **Polynomial Commitments:** KZG commitment operations
4. **Merkle Tree Proofs:** Aggregated Merkle proofs

## Testing Considerations

Test cases should include:
- Single pair (equivalent to G1MUL)
- Multiple pairs (2, 4, 8, 16)
- All zeros (point at infinity result)
- Mixed valid and infinity points
- Invalid input lengths
- Invalid points
- Gas calculation validation
- Discount table verification

## Performance Notes

- Significantly more efficient than separate MUL+ADD operations
- Pippenger's algorithm scales sub-linearly
- Discount reflects computational savings
- Most efficient for large batches (64+ pairs)

## Discount Floor

Per EIP-2537, the discount factor has a floor:
- Discount approaches **519** for very large k (≥128 points)
- This prevents gas cost from becoming too cheap
- Formula: `max(discount_table[k], 519)` for G1 MSM

## Comparison with Individual Operations

Computing k₁*P₁ + k₂*P₂ + ... + kₙ*Pₙ:

**Without MSM:**
- n G1MUL operations: n × 12,000 gas
- (n-1) G1ADD operations: (n-1) × 500 gas
- Total for 10 pairs: 124,500 gas

**With MSM:**
- 1 G1MSM operation: ~51,600 gas (10 pairs)
- **Savings: ~58% reduction**

## Security Notes

- **Constant-Time:** MSM must not leak scalar information
- **Point Validation:** All input points must be validated
- **Batch Verification:** Useful but must handle failures carefully
- **BLST Library:** Production-grade, audited implementation

## Related Precompiles

- **BLS12_G1ADD (0x0B):** Single addition
- **BLS12_G1MUL (0x0C):** Single scalar multiplication
- **BLS12_G2MSM (0x10):** MSM in G2 group
