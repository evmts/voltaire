# BN254PAIRING (0x08)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000008`
- **Available since:** Byzantium (EIP-197)
- **EIP:** [EIP-197](https://eips.ethereum.org/EIPS/eip-197) - BN254 curve pairing check
- **Updates:** [EIP-1108](https://eips.ethereum.org/EIPS/eip-1108) - Gas cost reduction (Istanbul)

## Purpose

Performs a bilinear pairing check on the BN254 (alt_bn128) curve. This is the core operation for zkSNARK verification, enabling succinct zero-knowledge proofs on Ethereum. The pairing check verifies that `e(A1, B1) * e(A2, B2) * ... * e(An, Bn) = 1` where `e` is the bilinear pairing function.

## Audit Status

⚠️ MIXED - Arkworks (Audited) / Pure Zig (Unaudited)

This implementation has two backends:

### Primary: Arkworks (via FFI) - ✅ AUDITED
- Library: arkworks-algebra BN254 pairing implementation (Rust)
- Status: Production-grade zkSNARK implementation
- Audit: Industry-standard, battle-tested
- Critical for: zkSNARK verification on Ethereum

### Fallback: Pure Zig - ⚠️ UNAUDITED
- Status: Custom Zig implementation, NOT audited
- Use: Only when Arkworks FFI unavailable
- Risk: Pairing operations are complex; unaudited code is high-risk

Recommendation:
- STRONGLY prefer Arkworks backend for production
- Pure Zig fallback should ONLY be used in development/testing
- Never use unaudited pairing in production systems

Current default: Check build configuration to confirm which backend is active.

## Gas Cost

**Dynamic:**
- Base gas: 45,000
- Per-pair gas: 34,000
- Formula: `45,000 + 34,000 * num_pairs`

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

Input must be a multiple of 192 bytes. Each 192-byte chunk represents one pairing:

**Per Pair (192 bytes):**

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 32     | a_x   | X coordinate of G1 point (big-endian) |
| 32     | 32     | a_y   | Y coordinate of G1 point (big-endian) |
| 64     | 32     | b_x1  | First component of G2 point X (big-endian) |
| 96     | 32     | b_x2  | Second component of G2 point X (big-endian) |
| 128    | 32     | b_y1  | First component of G2 point Y (big-endian) |
| 160    | 32     | b_y2  | Second component of G2 point Y (big-endian) |

**Multiple Pairs:** Concatenate 192-byte chunks for multiple pairings.

**Empty Input:** Zero pairs is valid and returns success (true).

## Output Format

Returns 32 bytes: success indicator as a boolean.

| Offset | Length | Field   | Description |
|--------|--------|---------|-------------|
| 0      | 31     | padding | Zero bytes |
| 31     | 1      | result  | 0x01 if pairing check succeeds, 0x00 if it fails |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const bn254_pairing = precompiles.bn254_pairing;

// Verify zkSNARK proof via pairing check
// Input: concatenated pairs (192 bytes each)
var input: []const u8 = get_zksnark_pairing_input();

const result = try bn254_pairing.execute(allocator, input, 1000000);
defer result.deinit(allocator);

// Check if pairing succeeded
if (result.output[31] == 1) {
    // zkSNARK proof is valid
} else {
    // zkSNARK proof is invalid
}
```

## Example: Empty Input

```zig
// Empty input (0 pairs) is valid and returns success
const input = [_]u8{};
const result = try bn254_pairing.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// result.output[31] == 1 (success)
```

## Implementation Details

1. **Input Validation:**
   - Length must be multiple of 192 bytes
   - Each G1 point (64 bytes) must be on the curve
   - Each G2 point (128 bytes) must be on the twist curve

2. **Pairing Computation:**
   - Uses pure Zig implementation via `crypto.bn254.bn254Pairing()`
   - Computes optimal Ate pairing for each pair
   - Multiplies all pairings together in GT (target group)
   - Checks if final result equals identity element

3. **Gas Calculation:**
   - `num_pairs = input.len / 192`
   - `gas = 45,000 + 34,000 * num_pairs`

4. **Error Handling:**
   - Invalid input length: `error.InvalidInput`
   - Invalid points: `error.InvalidPairing`
   - Insufficient gas: `error.OutOfGas`

## BN254 Curve Details

**G1 (Base Group):**
- Curve: y² = x³ + 3
- Field: Fp (prime field)

**G2 (Twist Group):**
- Curve: y² = x³ + 3/(9 + i)
- Field: Fp² (quadratic extension)

**GT (Target Group):**
- Field: Fp¹² (12th degree extension)

## Error Conditions

- **InvalidInput:** Input length not a multiple of 192 bytes
- **InvalidPairing:** Invalid G1 or G2 points
- **OutOfGas:** Insufficient gas for the number of pairs

## Gas Cost Examples

| Pairs | Input Size | Gas Cost |
|-------|------------|----------|
| 0     | 0 bytes    | 45,000   |
| 1     | 192 bytes  | 79,000   |
| 2     | 384 bytes  | 113,000  |
| 3     | 576 bytes  | 147,000  |
| 10    | 1920 bytes | 385,000  |

## Use Cases

1. **zkSNARK Verification:** Groth16, PLONK, and other zkSNARK schemes
2. **Privacy Protocols:** Tornado Cash, Aztec Protocol
3. **Scalability:** zkRollups, validiums
4. **Identity Systems:** Anonymous credentials, voting
5. **DeFi:** Privacy-preserving transactions

## Testing Considerations

Test cases should include:
- Empty input (0 pairs → success)
- Single valid pairing
- Multiple pairings
- Invalid pairings (should fail check)
- Invalid input lengths
- Invalid G1 points
- Invalid G2 points
- Gas cost validation for various pair counts
- Known zkSNARK verification vectors

## zkSNARK Verification Pattern

Typical zkSNARK verification uses the pairing equation:
```
e(proof.A, proof.B) * e(vk.alpha, vk.beta) * e(publicInputs, vk.gamma) * e(proof.C, vk.delta) = 1
```

This translates to calling the pairing precompile with the appropriate point pairs.

## Performance Notes

- Base cost reflects setup overhead (45,000 gas)
- Incremental cost per pair is significant (34,000 gas)
- Most zkSNARK verifications use 2-4 pairings
- Constant-time execution for security

## Security Notes

- **Critical for zkSNARKs:** Any bug breaks zero-knowledge proofs
- **Point Validation:** All points must be validated before pairing
- **Subgroup Checks:** Points must be in correct subgroups
- **Constant-Time:** Prevents timing attacks on proof verification
- **No Malleability:** Implementation must prevent pairing malleability

## Related Precompiles

- **BN254ADD (0x06):** Point addition on BN254
- **BN254MUL (0x07):** Scalar multiplication on BN254
