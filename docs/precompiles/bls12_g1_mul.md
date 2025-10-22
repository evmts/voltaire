# BLS12_G1MUL (0x0C)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x000000000000000000000000000000000000000C`
- **Available since:** Prague (EIP-2537)
- **EIP:** [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 curve operations

## Purpose

Performs elliptic curve scalar multiplication on the BLS12-381 G1 group. Given a point P and scalar k, computes k*P. This is fundamental for BLS signatures, key derivation, and commitment schemes.

## Gas Cost

**Constant:** 12,000 gas

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

**Exactly 160 bytes required:** One G1 point (128 bytes) and one scalar (32 bytes).

| Offset | Length | Field  | Description |
|--------|--------|--------|-------------|
| 0      | 64     | x      | X coordinate of point (big-endian Fp) |
| 64     | 64     | y      | Y coordinate of point (big-endian Fp) |
| 128    | 32     | scalar | Scalar multiplier (big-endian) |

**Encoding:**
- Coordinates: 64 bytes each (512 bits with padding)
- Scalar: 32 bytes (256 bits)
- Big-endian format

## Output Format

Returns 128 bytes: the resulting point.

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | x     | X coordinate of result point (big-endian Fp) |
| 64     | 64     | y     | Y coordinate of result point (big-endian Fp) |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const bls12_g1_mul = precompiles.bls12_g1_mul;

// Multiply a G1 point by a scalar
var input: [160]u8 = undefined;
@memcpy(input[0..64], &point_x);
@memcpy(input[64..128], &point_y);
@memcpy(input[128..160], &scalar);

const result = try bls12_g1_mul.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Extract result coordinates
const result_x = result.output[0..64];
const result_y = result.output[64..128];
```

## Implementation Details

1. **Input Validation:**
   - Must be exactly 160 bytes
   - Point must be valid G1 point
   - Scalar is arbitrary 32-byte value

2. **Multiplication:**
   - Uses BLST library via `crypto.Crypto.bls12_381.g1Mul()`
   - Efficient scalar multiplication algorithm
   - Handles point at infinity

3. **Error Handling:**
   - `InvalidInput`: Wrong length
   - `InvalidPoint`: Point not on curve

## BLS12-381 G1 Parameters

**Curve Equation:** y² = x³ + 4
- G1 subgroup order: r (large prime ~255 bits)
- Scalar range: [0, r)
- Scalars reduced modulo r

## Error Conditions

- **InvalidInput:** Input length is not 160 bytes
- **InvalidPoint:** Point coordinates are not on the curve
- **OutOfGas:** Insufficient gas (< 12,000)

## Special Cases

| Input                     | Output                    |
|---------------------------|---------------------------|
| Any point × 0             | Point at infinity         |
| Any point × 1             | Same point                |
| Point at infinity × k     | Point at infinity         |
| Point × r (group order)   | Point at infinity         |

## Use Cases

1. **BLS Signatures:** Key derivation, signature generation
2. **Commitments:** Pedersen commitments on BLS12-381
3. **Polynomial Commitments:** KZG-style commitments
4. **Distributed Key Generation:** Threshold cryptography

## Testing Considerations

Test cases should include:
- Multiply by 0, 1
- Multiply by group order r
- Small scalars (2, 3, 10)
- Large random scalars
- Point at infinity multiplication
- Invalid points
- Invalid input lengths

## Performance Notes

- 12,000 gas reflects computational cost
- Uses windowed scalar multiplication
- BLST library provides hardware optimization
- Constant-time execution

## Security Notes

- **Constant-Time:** Prevents scalar leakage via timing
- **Point Validation:** Must validate input point
- **Scalar Handling:** Scalars taken modulo group order
- **Side-Channel Resistance:** BLST protects against attacks

## Related Precompiles

- **BLS12_G1ADD (0x0B):** Addition in G1
- **BLS12_G1MSM (0x0D):** Multi-scalar multiplication in G1
- **BLS12_G2MUL (0x0F):** Scalar multiplication in G2
