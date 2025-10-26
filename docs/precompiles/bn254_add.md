# BN254ADD (0x06)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000006`
- **Available since:** Byzantium (EIP-196)
- **EIP:** [EIP-196](https://eips.ethereum.org/EIPS/eip-196) - BN254 curve addition
- **Updates:** [EIP-1108](https://eips.ethereum.org/EIPS/eip-1108) - Gas cost reduction (Istanbul)

## Purpose

Performs elliptic curve point addition on the BN254 (alt_bn128) curve. This is a fundamental operation for zkSNARKs and other zero-knowledge proof systems. The BN254 curve is specifically designed for efficient pairing-based cryptography.

## Audit Status

⚠️ MIXED - Arkworks (Audited) / Pure Zig (Unaudited)

This implementation has two backends:

### Primary: Arkworks (via FFI) - ✅ AUDITED
- Library: arkworks-algebra BN254 implementation (Rust)
- Status: Widely used in production zkSNARK systems
- Audit: Industry-standard implementation
- Performance: Optimized for production use

### Fallback: Pure Zig - ⚠️ UNAUDITED
- Status: Custom Zig implementation, NOT audited
- Use: Only when Arkworks FFI unavailable
- Risk: No formal security audit

Recommendation:
- Prefer Arkworks backend (default when available)
- Avoid pure Zig fallback in production without audit

Current default: Check build configuration to confirm which backend is active.

## Gas Cost

**Constant:** 150 gas (reduced from 500 in Istanbul via EIP-1108)

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

Expects 128 bytes representing two points on the BN254 curve (shorter inputs are zero-padded):

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 32     | x1    | X coordinate of first point (big-endian) |
| 32     | 32     | y1    | Y coordinate of first point (big-endian) |
| 64     | 32     | x2    | X coordinate of second point (big-endian) |
| 96     | 32     | y2    | Y coordinate of second point (big-endian) |

**Point at Infinity:** Represented by (0, 0)

## Output Format

Returns 64 bytes representing the sum of the two points:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 32     | x     | X coordinate of result point (big-endian) |
| 32     | 32     | y     | Y coordinate of result point (big-endian) |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const bn254_add = precompiles.bn254_add;

// Add two points on BN254 curve
var input: [128]u8 = undefined;
@memcpy(input[0..32], &point1_x);
@memcpy(input[32..64], &point1_y);
@memcpy(input[64..96], &point2_x);
@memcpy(input[96..128], &point2_y);

const result = try bn254_add.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Extract result coordinates
const result_x = result.output[0..32];
const result_y = result.output[32..64];
```

## Example: Adding Point at Infinity

```zig
// Adding point at infinity to itself returns point at infinity
const input = [_]u8{0} ** 128;
const result = try bn254_add.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Result is (0, 0) - point at infinity
```

## Implementation Details

1. **Input Padding:** Inputs shorter than 128 bytes are automatically zero-padded
2. **Curve Arithmetic:** Uses pure Zig implementation via `crypto.bn254.bn254Add()`
3. **Point Validation:** Points must be on the BN254 curve or the point at infinity
4. **Error Handling:** Invalid points return `error.InvalidPoint`

## BN254 Curve Parameters

The BN254 (alt_bn128) curve is defined by:
- Equation: y² = x³ + 3
- Field prime: 21888242871839275222246405745257275088696311157297823662689037894645226208583
- Curve order: 21888242871839275222246405745257275088548364400416034343698204186575808495617

## Error Conditions

- **OutOfGas:** Insufficient gas (< 150)
- **InvalidPoint:** Point coordinates are not on the curve

## Use Cases

1. **zkSNARKs:** Fundamental operation in zero-knowledge proofs
2. **Privacy Protocols:** Confidential transactions, mixing
3. **Cryptographic Signatures:** BLS signatures and aggregation
4. **Multi-Party Computation:** Secure computation protocols

## Testing Considerations

Test cases should include:
- Point at infinity + point at infinity
- Valid point + point at infinity
- Two distinct valid points
- Point + itself (doubling)
- Point + inverse (should give point at infinity)
- Invalid points (off curve)
- Edge cases at curve boundaries
- Gas consumption validation

## Performance Notes

- Very efficient operation (150 gas)
- Constant-time execution for security
- Pure Zig implementation (no external dependencies)
- Hardware acceleration where available

## Security Notes

- All operations must be constant-time to prevent timing attacks
- Point validation is critical - invalid points must be rejected
- Implementation uses field arithmetic modulo the curve's field prime
- No point compression (uncompressed format only)

## Related Precompiles

- **BN254MUL (0x07):** Scalar multiplication on BN254
- **BN254PAIRING (0x08):** Pairing check for zkSNARK verification
