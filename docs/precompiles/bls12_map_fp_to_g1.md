# BLS12_MAP_FP_TO_G1 (0x12)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000012`
- **Available since:** Prague (EIP-2537)
- **EIP:** [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 curve operations

## Purpose

Maps a field element from Fp to a point on the BLS12-381 G1 curve. This is a key component of hash-to-curve operations, enabling deterministic conversion of arbitrary data to G1 points. Essential for BLS signatures where messages must be hashed to curve points.

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

**Constant:** 5,500 gas

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

**Exactly 64 bytes required:** One Fp field element.

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | u     | Field element in Fp (big-endian, with padding) |

**Field Element:**
- 64 bytes total (512 bits)
- Actual Fp element is ~381 bits
- Must be less than BLS12-381 field modulus
- Big-endian encoding

## Output Format

Returns 128 bytes: a G1 point.

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | x     | X coordinate of G1 point (Fp) |
| 64     | 64     | y     | Y coordinate of G1 point (Fp) |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const bls12_map_fp_to_g1 = precompiles.bls12_map_fp_to_g1;

// Map a field element to G1
var input: [64]u8 = undefined;
@memcpy(input[0..64], &field_element);

const result = try bls12_map_fp_to_g1.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Extract G1 point coordinates
const point_x = result.output[0..64];
const point_y = result.output[64..128];
```

## Implementation Details

1. **Input Validation:**
   - Must be exactly 64 bytes
   - Must represent valid Fp field element
   - Element must be < field modulus

2. **Mapping:**
   - Uses BLST library via `crypto.Crypto.bls12_381.mapFpToG1()`
   - Implements simplified SWU (Shallue-van de Woestijne-Ulas) map
   - Deterministic mapping from Fp to G1

3. **Properties:**
   - Deterministic: same input always gives same output
   - Surjective: covers all G1 points (with varying probability)
   - Not injective: multiple inputs may map to same point

## Hash-to-Curve Context

This precompile is part of the hash-to-curve process:

**Full Hash-to-Curve (simplified):**
1. Hash message to two field elements: u₀, u₁
2. Map each to G1: P₀ = map_to_G1(u₀), P₁ = map_to_G1(u₁)
3. Add points: P = P₀ + P₁
4. Clear cofactor (if needed)

This precompile handles step 2.

## BLS12-381 G1 Parameters

**Curve Equation:** y² = x³ + 4
- Field: Fp (381-bit prime)
- Field modulus: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab

## Error Conditions

- **InvalidInput:** Input length is not 64 bytes
- **InvalidPoint:** Field element is invalid or ≥ field modulus
- **OutOfGas:** Insufficient gas (< 5,500)

## Use Cases

1. **BLS Signatures:** Hash messages to G1 for signing
2. **Hash-to-Curve:** Building complete hash-to-curve implementations
3. **Verifiable Random Functions:** Deterministic curve points
4. **Cryptographic Protocols:** Any protocol needing deterministic G1 points

## Testing Considerations

Test cases should include:
- Zero field element
- Small field elements (1, 2, 10)
- Large field elements near modulus
- Invalid input lengths
- Field elements ≥ modulus (should error)
- Determinism: same input produces same output

## Comparison with Direct Encoding

| Method               | Process                  | Complexity |
|----------------------|--------------------------|------------|
| Map Fp to G1 (0x12)  | Deterministic map       | 5,500 gas  |
| Direct encoding      | Try-and-increment       | Variable   |

## Performance Notes

- 5,500 gas is reasonable for the operation
- Deterministic performance (no retries)
- Uses optimized BLST implementation
- More efficient than try-and-increment

## Hash-to-Curve Standards

This precompile follows:
- **RFC 9380:** Hash to Elliptic Curves
- **Draft:** hash-to-curve-bls12381-g1
- Simplified SWU mapping algorithm

## Example: Hash-to-Curve Flow

```zig
// Step 1: Hash message to two field elements
const u0 = hash_to_field(msg, dst, 0);
const u1 = hash_to_field(msg, dst, 1);

// Step 2: Map to G1 (using this precompile)
const p0 = try bls12_map_fp_to_g1.execute(allocator, &u0, gas);
defer p0.deinit(allocator);

const p1 = try bls12_map_fp_to_g1.execute(allocator, &u1, gas);
defer p1.deinit(allocator);

// Step 3: Add points
var add_input: [256]u8 = undefined;
@memcpy(add_input[0..128], p0.output);
@memcpy(add_input[128..256], p1.output);

const result = try bls12_g1_add.execute(allocator, &add_input, gas);
defer result.deinit(allocator);

// Result is hash-to-curve of message
```

## Security Notes

- **Deterministic:** Same input always produces same output (important for signatures)
- **No Secret Data:** Input is public field element
- **Constant-Time:** BLST implementation prevents timing attacks
- **Standards Compliant:** Follows RFC 9380

## Related Precompiles

- **BLS12_MAP_FP2_TO_G2 (0x13):** Map Fp² to G2
- **BLS12_G1ADD (0x0B):** Add mapped points
- **BLS12_G1MUL (0x0C):** Scale mapped points
