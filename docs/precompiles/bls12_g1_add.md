# BLS12_G1ADD (0x0B)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x000000000000000000000000000000000000000B`
- **Available since:** Prague (EIP-2537)
- **EIP:** [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 curve operations

## Purpose

Performs elliptic curve point addition on the BLS12-381 G1 group. BLS12-381 is a pairing-friendly curve used in BLS signatures, zero-knowledge proofs, and consensus protocols (Ethereum 2.0). G1 operations are on the base field Fp.

## Gas Cost

**Constant:** 500 gas

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

**Exactly 256 bytes required:** Two G1 points (128 bytes each).

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | x1    | X coordinate of first point (big-endian Fp) |
| 64     | 64     | y1    | Y coordinate of first point (big-endian Fp) |
| 128    | 64     | x2    | X coordinate of second point (big-endian Fp) |
| 192    | 64     | y2    | Y coordinate of second point (big-endian Fp) |

**Encoding:**
- Each coordinate is 64 bytes (512 bits)
- Big-endian format
- Must be valid Fp field elements (< BLS12-381 field modulus)
- Point at infinity: Special encoding per EIP-2537

## Output Format

Returns 128 bytes: the sum of the two points.

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | x     | X coordinate of result point (big-endian Fp) |
| 64     | 64     | y     | Y coordinate of result point (big-endian Fp) |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const bls12_g1_add = precompiles.bls12_g1_add;

// Add two G1 points
var input: [256]u8 = undefined;
@memcpy(input[0..64], &point1_x);
@memcpy(input[64..128], &point1_y);
@memcpy(input[128..192], &point2_x);
@memcpy(input[192..256], &point2_y);

const result = try bls12_g1_add.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Extract result coordinates
const result_x = result.output[0..64];
const result_y = result.output[64..128];
```

## Implementation Details

1. **Input Validation:**
   - Must be exactly 256 bytes
   - Each coordinate must be valid Fp element
   - Points must be on the curve or point at infinity

2. **Addition:**
   - Uses BLST library via `crypto.Crypto.bls12_381.g1Add()`
   - Implements elliptic curve group law
   - Handles special cases (point at infinity, doubling)

3. **Error Handling:**
   - `InvalidInput`: Wrong length
   - `InvalidPoint`: Point not on curve or invalid encoding

## BLS12-381 G1 Parameters

**Curve Equation:** y² = x³ + 4
- Field: Fp (381-bit prime)
- Coordinate size: 48 bytes (compressed) or 96 bytes (uncompressed)
- Precompile uses uncompressed format (64 bytes per coordinate with padding)

**Field Modulus:**
```
p = 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab
```

## Error Conditions

- **InvalidInput:** Input length is not 256 bytes
- **InvalidPoint:** Point coordinates are not on the curve
- **OutOfGas:** Insufficient gas (< 500)

## Use Cases

1. **BLS Signatures:** Signature aggregation and verification
2. **Ethereum 2.0:** Validator signatures
3. **Zero-Knowledge Proofs:** BLS12-381-based zkSNARKs
4. **Cryptographic Protocols:** Multi-signatures, threshold signatures

## Testing Considerations

Test cases should include:
- Two arbitrary G1 points
- Point + point at infinity
- Point + itself (doubling)
- Point + inverse (result is infinity)
- Invalid input length
- Invalid points (off curve)
- Points with invalid field elements

## Performance Notes

- 500 gas makes it efficient for signature operations
- Uses optimized BLST library
- Constant-time execution for security

## Security Notes

- **Point Validation:** Critical to validate all input points
- **Constant-Time:** Prevents timing attacks
- **Subgroup Checks:** May be required depending on protocol
- **BLST Library:** Uses audited, production-grade implementation

## Related Precompiles

- **BLS12_G1MUL (0x0C):** Scalar multiplication in G1
- **BLS12_G1MSM (0x0D):** Multi-scalar multiplication in G1
- **BLS12_G2ADD (0x0E):** Addition in G2 group
- **BLS12_PAIRING (0x11):** Pairing check
