# BN254MUL (0x07)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000007`
- **Available since:** Byzantium (EIP-196)
- **EIP:** [EIP-196](https://eips.ethereum.org/EIPS/eip-196) - BN254 curve scalar multiplication
- **Updates:** [EIP-1108](https://eips.ethereum.org/EIPS/eip-1108) - Gas cost reduction (Istanbul)

## Purpose

Performs elliptic curve scalar multiplication on the BN254 (alt_bn128) curve. Given a point P and scalar k, computes k*P. This is essential for zkSNARKs, commitments, and various cryptographic protocols.

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

**Constant:** 6,000 gas (reduced from 40,000 in Istanbul via EIP-1108)

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

Expects 96 bytes: a point (64 bytes) and a scalar (32 bytes). Shorter inputs are zero-padded.

| Offset | Length | Field  | Description |
|--------|--------|--------|-------------|
| 0      | 32     | x      | X coordinate of point (big-endian) |
| 32     | 32     | y      | Y coordinate of point (big-endian) |
| 64     | 32     | scalar | Scalar multiplier (big-endian) |

**Point at Infinity:** Represented by (0, 0)

## Output Format

Returns 64 bytes representing the resulting point:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 32     | x     | X coordinate of result point (big-endian) |
| 32     | 32     | y     | Y coordinate of result point (big-endian) |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const bn254_mul = precompiles.bn254_mul;

// Multiply a point by a scalar
var input: [96]u8 = undefined;
@memcpy(input[0..32], &point_x);
@memcpy(input[32..64], &point_y);
@memcpy(input[64..96], &scalar);

const result = try bn254_mul.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Extract result coordinates
const result_x = result.output[0..32];
const result_y = result.output[32..64];
```

## Example: Multiply by Zero

```zig
// Multiply any point by zero returns point at infinity
var input: [96]u8 = [_]u8{0} ** 96;
// Set some point coordinates
input[0] = 1;
input[32] = 2;
// Scalar is zero (already zeroed)

const result = try bn254_mul.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Result is (0, 0) - point at infinity
```

## Example: Multiply by One

```zig
// Multiply point by 1 returns the same point
var input: [96]u8 = undefined;
@memcpy(input[0..32], &point_x);
@memcpy(input[32..64], &point_y);
@memset(input[64..95], 0);
input[95] = 1; // scalar = 1

const result = try bn254_mul.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Result equals input point
```

## Implementation Details

1. **Input Padding:** Inputs shorter than 96 bytes are automatically zero-padded
2. **Curve Arithmetic:** Uses pure Zig implementation via `crypto.bn254.bn254Mul()`
3. **Point Validation:** Input point must be on the BN254 curve or point at infinity
4. **Optimization:** Uses windowed/sliding window methods for efficiency
5. **Error Handling:** Invalid points return `error.InvalidPoint`

## BN254 Curve Parameters

The BN254 (alt_bn128) curve is defined by:
- Equation: y² = x³ + 3
- Field prime: 21888242871839275222246405745257275088696311157297823662689037894645226208583
- Curve order: 21888242871839275222246405745257275088548364400416034343698204186575808495617

## Error Conditions

- **OutOfGas:** Insufficient gas (< 6,000)
- **InvalidPoint:** Point coordinates are not on the curve

## Special Cases

| Input                          | Output                     |
|--------------------------------|----------------------------|
| Any point × 0                  | Point at infinity (0, 0)  |
| Any point × 1                  | Same point                 |
| Point at infinity × any scalar | Point at infinity (0, 0)  |
| Point × curve order            | Point at infinity (0, 0)  |

## Use Cases

1. **zkSNARKs:** Computing proof components and verification keys
2. **Commitments:** Pedersen commitments, vector commitments
3. **Signatures:** BLS signature schemes
4. **Privacy Protocols:** Stealth addresses, confidential transactions
5. **Key Derivation:** Hierarchical deterministic key generation

## Testing Considerations

Test cases should include:
- Multiply by zero (any point → infinity)
- Multiply by one (identity)
- Multiply by curve order (→ infinity)
- Small scalars (2, 3, 10)
- Large scalars
- Point at infinity × any scalar
- Invalid points (off curve)
- Generator point multiplication
- Gas consumption validation

## Performance Notes

- Efficient operation at 6,000 gas
- Uses optimized scalar multiplication algorithms
- Constant-time execution for security
- Pure Zig implementation

## Security Notes

- **Constant-Time:** Operations must not leak information via timing
- **Point Validation:** Critical to reject invalid points
- **Scalar Range:** Scalars are taken modulo the curve order
- **Side-Channel Resistance:** Implementation avoids timing attacks

## Related Precompiles

- **BN254ADD (0x06):** Point addition on BN254
- **BN254PAIRING (0x08):** Pairing check for zkSNARK verification
