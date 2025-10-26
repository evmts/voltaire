# BLS12_PAIRING (0x11)

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Address and EIP Reference

- **Address:** `0x0000000000000000000000000000000000000011`
- **Available since:** Prague (EIP-2537)
- **EIP:** [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS12-381 curve operations

## Purpose

Performs a bilinear pairing check on the BLS12-381 curve. Verifies that `e(A₁, B₁) * e(A₂, B₂) * ... * e(Aₙ, Bₙ) = 1` where `e` is the optimal ate pairing. This is fundamental for BLS signature verification and zero-knowledge proofs on BLS12-381.

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

**Dynamic:**
- Base gas: 37,700
- Per-pair gas: 32,600
- Formula: `37,700 + 32,600 * k`

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

**Multiple of 384 bytes:** Each 384-byte chunk represents one pairing (G1 point + G2 point).

**Per Pair (384 bytes):**

| Offset | Length | Field  | Description |
|--------|--------|--------|-------------|
| 0      | 64     | a_x    | X coordinate of G1 point (Fp) |
| 64     | 64     | a_y    | Y coordinate of G1 point (Fp) |
| 128    | 64     | b_x_c0 | X component 0 of G2 point (Fp) |
| 192    | 64     | b_x_c1 | X component 1 of G2 point (Fp) |
| 256    | 64     | b_y_c0 | Y component 0 of G2 point (Fp) |
| 320    | 64     | b_y_c1 | Y component 1 of G2 point (Fp) |

**Empty Input:** Zero pairs is valid and returns success (true).

## Output Format

Returns 32 bytes: success indicator.

| Offset | Length | Field   | Description |
|--------|--------|---------|-------------|
| 0      | 31     | padding | Zero bytes |
| 31     | 1      | result  | 0x01 if pairing check succeeds, 0x00 if fails |

## Example Usage

```zig
const std = @import("std");
const precompiles = @import("precompiles");
const bls12_pairing = precompiles.bls12_pairing;

// Verify BLS signature via pairing check
// e(signature, generator_G2) == e(hash_to_G1(msg), pubkey_G2)
// Reformulated as: e(signature, generator_G2) * e(-hash, pubkey) == 1

var input: [768]u8 = undefined; // 2 pairs = 768 bytes

// First pair: (signature, generator_G2)
@memcpy(input[0..64], &signature_x);
@memcpy(input[64..128], &signature_y);
@memcpy(input[128..192], &generator_g2_x_c0);
@memcpy(input[192..256], &generator_g2_x_c1);
@memcpy(input[256..320], &generator_g2_y_c0);
@memcpy(input[320..384], &generator_g2_y_c1);

// Second pair: (-hash_to_G1(msg), pubkey_G2)
@memcpy(input[384..448], &neg_hash_x);
@memcpy(input[448..512], &neg_hash_y);
@memcpy(input[512..576], &pubkey_x_c0);
@memcpy(input[576..640], &pubkey_x_c1);
@memcpy(input[640..704], &pubkey_y_c0);
@memcpy(input[704..768], &pubkey_y_c1);

const result = try bls12_pairing.execute(allocator, &input, 1000000);
defer result.deinit(allocator);

// Check if pairing succeeded
const signature_valid = (result.output[31] == 1);
```

## Implementation Details

1. **Input Validation:**
   - Length must be multiple of 384 bytes
   - Each G1 point must be valid (128 bytes)
   - Each G2 point must be valid (256 bytes)

2. **Pairing Computation:**
   - Uses BLST library via `crypto.Crypto.bls12_381.pairing()`
   - Computes optimal ate pairing for each pair
   - Multiplies all pairings in GT (Fp¹²)
   - Checks if result equals identity

3. **Gas Calculation:**
   - `k = input.len / 384`
   - `gas = 37,700 + 32,600 * k`

4. **Error Handling:**
   - `InvalidInput`: Length not multiple of 384
   - `InvalidPairing`: Invalid G1 or G2 points
   - `OutOfGas`: Insufficient gas

## BLS12-381 Pairing Details

**Pairing Function:** e: G1 × G2 → GT
- G1: Points over Fp (base field)
- G2: Points over Fp² (quadratic extension)
- GT: Elements of Fp¹² (12th degree extension)

**Properties:**
- Bilinearity: e(aP, bQ) = e(P, Q)^(ab)
- Non-degeneracy: e(G1, G2) ≠ 1 for generators
- Optimal ate pairing for efficiency

## Error Conditions

- **InvalidInput:** Input length not a multiple of 384 bytes
- **InvalidPairing:** Invalid G1 or G2 points
- **OutOfGas:** Insufficient gas for the number of pairs

## Gas Cost Examples

| Pairs | Input Size | Gas Cost |
|-------|------------|----------|
| 0     | 0 bytes    | 37,700   |
| 1     | 384 bytes  | 70,300   |
| 2     | 768 bytes  | 102,900  |
| 3     | 1152 bytes | 135,500  |
| 10    | 3840 bytes | 363,700  |

## BLS Signature Verification

**Standard BLS Signature Scheme:**
- Private key: scalar s
- Public key: P = s * G2
- Signature: σ = s * H(m) where H: {0,1}* → G1
- Verification: e(σ, G2) = e(H(m), P)

**Reformulated for pairing check:**
e(σ, G2) * e(H(m), -P) = 1

Or equivalently:
e(σ, G2) * e(-H(m), P) = 1

## Use Cases

1. **BLS Signatures:** Signature verification (Ethereum 2.0)
2. **Signature Aggregation:** Batch verification of multiple signatures
3. **Zero-Knowledge Proofs:** BLS12-381-based zkSNARKs
4. **Consensus:** Ethereum 2.0 validator signatures

## Testing Considerations

Test cases should include:
- Empty input (returns success)
- Single valid pairing
- Multiple pairings
- Invalid pairings (should fail)
- Invalid input lengths
- Invalid G1 points
- Invalid G2 points
- Gas calculation for various pair counts

## Performance Notes

- Base cost (37,700) reflects setup overhead
- Each additional pair costs 32,600 gas
- Pairing is expensive but necessary for BLS
- Most signature verifications use 1-2 pairings

## Comparison with BN254

| Feature      | BLS12_PAIRING | BN254PAIRING |
|--------------|---------------|--------------|
| Curve        | BLS12-381     | BN254        |
| Base gas     | 37,700        | 45,000       |
| Per-pair gas | 32,600        | 34,000       |
| Pair size    | 384 bytes     | 192 bytes    |
| Security     | ~128-bit      | ~100-bit     |
| Use case     | BLS sigs      | zkSNARKs     |

## Ethereum 2.0 Context

This precompile is critical for Ethereum 2.0:
- Validators sign attestations using BLS
- Signatures are aggregated for efficiency
- Pairing check verifies aggregated signatures
- Enables 100,000+ validators with manageable overhead

## Security Notes

- **Critical for Consensus:** Bugs break Ethereum 2.0 security
- **Point Validation:** All points must be validated
- **Subgroup Checks:** Points must be in correct subgroups
- **Constant-Time:** Prevents timing attacks
- **BLST Library:** Uses production-grade, audited implementation

## Related Precompiles

- **BLS12_G1ADD (0x0B):** Addition in G1
- **BLS12_G1MUL (0x0C):** Scalar multiplication in G1
- **BLS12_G2ADD (0x0E):** Addition in G2
- **BLS12_G2MUL (0x0F):** Scalar multiplication in G2
- **BN254PAIRING (0x08):** Alternative pairing for zkSNARKs
