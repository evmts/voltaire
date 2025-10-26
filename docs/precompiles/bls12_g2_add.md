# BLS12_G2ADD (0x0E)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x000000000000000000000000000000000000000E`
- **Available since:** Prague (EIP-2537)
- **EIP:** [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 curve operations

## Purpose

Performs elliptic curve point addition on the BLS12-381 G2 group. G2 operations are on the extension field Fp² and are used in BLS signatures where the public keys live in G2. This is the "other side" of BLS12-381 pairings.

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

**Constant:** 600 gas

(Higher than G1ADD's 375 gas due to operations in Fp²)

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

**Exactly 512 bytes required:** Two G2 points (256 bytes each).

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | x1_c0 | X coordinate component 0 of first point (Fp) |
| 64     | 64     | x1_c1 | X coordinate component 1 of first point (Fp) |
| 128    | 64     | y1_c0 | Y coordinate component 0 of first point (Fp) |
| 192    | 64     | y1_c1 | Y coordinate component 1 of first point (Fp) |
| 256    | 64     | x2_c0 | X coordinate component 0 of second point (Fp) |
| 320    | 64     | x2_c1 | X coordinate component 1 of second point (Fp) |
| 384    | 64     | y2_c0 | Y coordinate component 0 of second point (Fp) |
| 448    | 64     | y2_c1 | Y coordinate component 1 of second point (Fp) |

**G2 Coordinates:**
- Each coordinate is in Fp² (quadratic extension)
- Represented as (c0, c1) where value = c0 + c1*u
- Each component is 64 bytes (big-endian Fp element)

## Output Format

Returns 256 bytes: the sum of the two G2 points.

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
const bls12_g2_add = precompiles.bls12_g2_add;

// Add two G2 points
var input: [512]u8 = undefined;

// First point (x1, y1) where x1, y1 are in Fp²
@memcpy(input[0..64], &point1_x_c0);
@memcpy(input[64..128], &point1_x_c1);
@memcpy(input[128..192], &point1_y_c0);
@memcpy(input[192..256], &point1_y_c1);

// Second point (x2, y2)
@memcpy(input[256..320], &point2_x_c0);
@memcpy(input[320..384], &point2_x_c1);
@memcpy(input[384..448], &point2_y_c0);
@memcpy(input[448..512], &point2_y_c1);

const result = try bls12_g2_add.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Extract result (256 bytes = 4 Fp components)
```

## Implementation Details

1. **Input Validation:**
   - Must be exactly 512 bytes
   - Each Fp component must be < field modulus
   - Points must be on G2 curve

2. **Addition:**
   - Uses BLST library via `crypto.Crypto.bls12_381.g2Add()`
   - Implements elliptic curve group law in Fp²
   - Handles point at infinity and doubling

3. **Error Handling:**
   - `InvalidInput`: Wrong length
   - `InvalidPoint`: Point not on G2 curve

## BLS12-381 G2 Parameters

**Curve Equation:** y² = x³ + 4(1 + u)
- Defined over Fp² extension field
- Base field: Fp (381-bit prime)
- Extension field: Fp² = Fp[u]/(u² + 1)

## Error Conditions

- **InvalidInput:** Input length is not 512 bytes
- **InvalidPoint:** Point coordinates are not on the G2 curve
- **OutOfGas:** Insufficient gas (< 600)

## Use Cases

1. **BLS Signatures:** Public key aggregation in G2
2. **Signature Schemes:** Where public keys are in G2
3. **Pairings:** Preparing G2 elements for pairing operations
4. **Threshold Cryptography:** Distributed key generation

## Testing Considerations

Test cases should include:
- Two arbitrary G2 points
- Point + point at infinity
- Point + itself (doubling)
- Point + inverse
- Invalid input length
- Invalid G2 points
- Points with invalid field elements

## Performance Notes

- 600 gas (vs 375 for G1) reflects Fp² operations
- Uses optimized BLST library
- Constant-time execution
- More expensive than G1 operations

## G1 vs G2 Comparison

| Feature          | G1 (0x0B)    | G2 (0x0E)    |
|------------------|--------------|--------------|
| Field            | Fp           | Fp²          |
| Point size       | 128 bytes    | 256 bytes    |
| Input size       | 256 bytes    | 512 bytes    |
| Gas cost         | 375          | 600          |
| Use case         | Signatures   | Public keys  |

## BLS Signature Schemes

**Standard BLS (signatures in G1):**
- Secret key: scalar
- Public key: G2 point
- Signature: G1 point
- Uses G2ADD for public key aggregation

**Alternative BLS (signatures in G2):**
- Secret key: scalar
- Public key: G1 point
- Signature: G2 point
- Uses G2ADD for signature aggregation

## Security Notes

- **Point Validation:** Critical for G2 points
- **Constant-Time:** Prevents timing attacks
- **Subgroup Checks:** Required for security in some protocols
- **BLST Library:** Audited implementation

## Related Precompiles

- **BLS12_G2MUL (0x0F):** Scalar multiplication in G2
- **BLS12_G2MSM (0x10):** Multi-scalar multiplication in G2
- **BLS12_G1ADD (0x0B):** Addition in G1 group
- **BLS12_PAIRING (0x11):** Pairing check
