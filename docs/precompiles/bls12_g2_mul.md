# BLS12_G2MUL (0x0F)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x000000000000000000000000000000000000000F`
- **Available since:** Prague (EIP-2537)
- **EIP:** [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 curve operations

## Purpose

Performs elliptic curve scalar multiplication on the BLS12-381 G2 group. Given a G2 point P and scalar k, computes k*P. Essential for BLS signature schemes where public keys or signatures live in G2.

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

**Constant:** 22,500 gas

(Higher than G1MUL's 12,000 gas due to operations in Fp²)

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

**Exactly 288 bytes required:** One G2 point (256 bytes) and one scalar (32 bytes).

| Offset | Length | Field  | Description |
|--------|--------|--------|-------------|
| 0      | 64     | x_c0   | X coordinate component 0 (Fp) |
| 64     | 64     | x_c1   | X coordinate component 1 (Fp) |
| 128    | 64     | y_c0   | Y coordinate component 0 (Fp) |
| 192    | 64     | y_c1   | Y coordinate component 1 (Fp) |
| 256    | 32     | scalar | Scalar multiplier (big-endian) |

**G2 Coordinates:**
- Each coordinate is in Fp² = (c0, c1)
- Each component is 64 bytes

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
const bls12_g2_mul = precompiles.bls12_g2_mul;

// Multiply a G2 point by a scalar
var input: [288]u8 = undefined;

// G2 point (256 bytes)
@memcpy(input[0..64], &point_x_c0);
@memcpy(input[64..128], &point_x_c1);
@memcpy(input[128..192], &point_y_c0);
@memcpy(input[192..256], &point_y_c1);

// Scalar (32 bytes)
@memcpy(input[256..288], &scalar);

const result = try bls12_g2_mul.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Result is a G2 point (256 bytes)
```

## Implementation Details

1. **Input Validation:**
   - Must be exactly 288 bytes
   - Point must be valid G2 point
   - Scalar is arbitrary 32-byte value

2. **Multiplication:**
   - Uses BLST library via `crypto.Crypto.bls12_381.g2Mul()`
   - Efficient windowed scalar multiplication
   - Operations in Fp² extension field

3. **Error Handling:**
   - `InvalidInput`: Wrong length
   - `InvalidPoint`: Point not on G2 curve

## BLS12-381 G2 Parameters

**Curve Equation:** y² = x³ + 4(1 + u)
- Field: Fp² (quadratic extension)
- G2 subgroup order: r (same as G1)
- Scalars reduced modulo r

## Error Conditions

- **InvalidInput:** Input length is not 288 bytes
- **InvalidPoint:** Point coordinates are not on the G2 curve
- **OutOfGas:** Insufficient gas (< 22,500)

## Special Cases

| Input                     | Output                    |
|---------------------------|---------------------------|
| Any point × 0             | Point at infinity         |
| Any point × 1             | Same point                |
| Point at infinity × k     | Point at infinity         |
| Point × r (group order)   | Point at infinity         |

## Use Cases

1. **BLS Signatures:** Public key derivation (when keys in G2)
2. **Signature Aggregation:** Scaling signatures (when sigs in G2)
3. **Threshold Signatures:** Share generation and combining
4. **Key Derivation:** Hierarchical deterministic keys

## Testing Considerations

Test cases should include:
- Multiply by 0, 1
- Multiply by group order r
- Small scalars
- Large random scalars
- Point at infinity multiplication
- Invalid G2 points
- Invalid input lengths

## Performance Notes

- 22,500 gas (vs 12,000 for G1) reflects Fp² operations
- Uses optimized BLST library
- Constant-time execution
- ~1.88x more expensive than G1MUL

## G1 vs G2 Scalar Multiplication

| Feature          | G1MUL (0x0C) | G2MUL (0x0F) |
|------------------|--------------|--------------|
| Field            | Fp           | Fp²          |
| Input size       | 160 bytes    | 288 bytes    |
| Output size      | 128 bytes    | 256 bytes    |
| Gas cost         | 12,000       | 22,500       |
| Cost ratio       | 1×           | 1.88×        |

## BLS Signature Context

**When to use G2MUL:**
- Standard BLS: Public key generation (pk = sk * G2_generator)
- Alternative BLS: Signature generation (sig = sk * H(m))
- Signature aggregation: Combining signatures
- Threshold schemes: Share distribution

## Security Notes

- **Constant-Time:** Must not leak scalar information
- **Point Validation:** Critical for G2 points
- **Scalar Handling:** Reduced modulo subgroup order
- **Side-Channel Resistance:** BLST provides protection

## Related Precompiles

- **BLS12_G2ADD (0x0E):** Addition in G2
- **BLS12_G2MSM (0x10):** Multi-scalar multiplication in G2
- **BLS12_G1MUL (0x0C):** Scalar multiplication in G1
- **BLS12_PAIRING (0x11):** Pairing operations
