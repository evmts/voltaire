# BLS12_MAP_FP2_TO_G2 (0x13)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000013`
- **Available since:** Prague (EIP-2537)
- **EIP:** [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 curve operations

## Purpose

Maps a field element from Fp² (quadratic extension field) to a point on the BLS12-381 G2 curve. This is the G2 equivalent of MAP_FP_TO_G1, enabling hash-to-curve operations for G2. Essential when public keys or signatures reside in G2.

## Gas Cost

**Constant:** 23,800 gas

(Higher than G1 map's 5,500 gas due to operations in Fp²)

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

**Exactly 128 bytes required:** One Fp² field element (two Fp components).

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 64     | u_c0  | Component 0 of Fp² element (Fp, big-endian) |
| 64     | 64     | u_c1  | Component 1 of Fp² element (Fp, big-endian) |

**Fp² Element:**
- Represented as u = u_c0 + u_c1 * i
- Each component is 64 bytes (with padding)
- Both must be valid Fp elements

## Output Format

Returns 256 bytes: a G2 point.

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
const bls12_map_fp2_to_g2 = precompiles.bls12_map_fp2_to_g2;

// Map an Fp² element to G2
var input: [128]u8 = undefined;
@memcpy(input[0..64], &fp2_element_c0);
@memcpy(input[64..128], &fp2_element_c1);

const result = try bls12_map_fp2_to_g2.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Extract G2 point coordinates (256 bytes)
const point_x_c0 = result.output[0..64];
const point_x_c1 = result.output[64..128];
const point_y_c0 = result.output[128..192];
const point_y_c1 = result.output[192..256];
```

## Implementation Details

1. **Input Validation:**
   - Must be exactly 128 bytes
   - Both components must be valid Fp elements
   - Each component < field modulus

2. **Mapping:**
   - Uses BLST library via `crypto.Crypto.bls12_381.mapFp2ToG2()`
   - Implements simplified SWU map for G2
   - Deterministic mapping from Fp² to G2

3. **Properties:**
   - Deterministic: same input → same output
   - Surjective: covers G2 curve
   - Not injective: multiple inputs may map to same point

## Hash-to-Curve for G2

This precompile is part of hash-to-G2:

**Full Hash-to-G2 (simplified):**
1. Hash message to two Fp² elements: u₀, u₁
2. Map each to G2: P₀ = map_to_G2(u₀), P₁ = map_to_G2(u₁)
3. Add points: P = P₀ + P₁
4. Clear cofactor (if needed)

This precompile handles step 2.

## BLS12-381 G2 Parameters

**Curve Equation:** y² = x³ + 4(1 + i)
- Field: Fp² = Fp[i]/(i² + 1)
- Extension field over 381-bit prime base field
- Coordinates are pairs of Fp elements

## Error Conditions

- **InvalidInput:** Input length is not 128 bytes
- **InvalidPoint:** Fp² element is invalid or components ≥ modulus
- **OutOfGas:** Insufficient gas (< 23,800)

## Use Cases

1. **BLS Signatures:** Hash messages to G2 (alternative BLS)
2. **Public Key Derivation:** Deterministic G2 public keys
3. **Hash-to-Curve:** Building complete hash-to-G2 implementations
4. **VRFs:** Verifiable random functions using G2

## Testing Considerations

Test cases should include:
- Zero Fp² element (0, 0)
- Elements with one zero component
- Small Fp² elements
- Large elements near modulus
- Invalid input lengths
- Invalid field elements
- Determinism verification

## Gas Cost Comparison

| Precompile     | Field  | Gas    | Ratio |
|----------------|--------|--------|-------|
| MAP_FP_TO_G1   | Fp     | 5,500  | 1×    |
| MAP_FP2_TO_G2  | Fp²    | 23,800 | 4.3×  |

The G2 operation is significantly more expensive due to working in the extension field Fp².

## Performance Notes

- 23,800 gas reflects Fp² arithmetic complexity
- Deterministic performance (no retries)
- Uses optimized BLST implementation
- More expensive than G1 mapping but still efficient

## Hash-to-Curve Standards

Follows the same standards as MAP_FP_TO_G1:
- **RFC 9380:** Hash to Elliptic Curves
- **Draft:** hash-to-curve-bls12381-g2
- Simplified SWU mapping for G2

## Example: Hash-to-G2 Flow

```zig
// Step 1: Hash message to two Fp² elements
const u0 = hash_to_fp2_field(msg, dst, 0);
const u1 = hash_to_fp2_field(msg, dst, 1);

// Step 2: Map to G2 (using this precompile)
const p0 = try bls12_map_fp2_to_g2.execute(allocator, &u0, gas);
defer p0.deinit(allocator);

const p1 = try bls12_map_fp2_to_g2.execute(allocator, &u1, gas);
defer p1.deinit(allocator);

// Step 3: Add points
var add_input: [512]u8 = undefined;
@memcpy(add_input[0..256], p0.output);
@memcpy(add_input[256..512], p1.output);

const result = try bls12_g2_add.execute(allocator, &add_input, gas);
defer result.deinit(allocator);

// Result is hash-to-G2 of message
```

## BLS Signature Schemes

**When to use MAP_FP2_TO_G2:**
- Alternative BLS: Messages hashed to G2, signatures in G1
- Public keys in G2, hash messages to G2 for verification
- Threshold signatures with G2 shares

**Standard vs Alternative BLS:**

| Scheme     | Message Hash | Signature | Public Key | Map Used |
|------------|--------------|-----------|------------|----------|
| Standard   | → G1         | G1        | G2         | 0x12     |
| Alternative| → G2         | G2        | G1         | 0x13     |

## Security Notes

- **Deterministic:** Critical for signature schemes
- **Constant-Time:** BLST prevents timing attacks
- **Standards Compliant:** Follows RFC 9380
- **Fp² Arithmetic:** More complex but secure

## Related Precompiles

- **BLS12_MAP_FP_TO_G1 (0x12):** Map Fp to G1 (cheaper alternative)
- **BLS12_G2ADD (0x0E):** Add mapped G2 points
- **BLS12_G2MUL (0x0F):** Scale mapped G2 points
- **BLS12_PAIRING (0x11):** Use mapped points in pairings
