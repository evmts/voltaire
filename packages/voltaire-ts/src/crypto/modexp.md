# ModExp (Modular Exponentiation)

Compute (base^exponent) mod modulus efficiently for large integers.

## Overview

Modular exponentiation is a fundamental operation in public-key cryptography. The `modexp` precompile (0x05) provides efficient computation for RSA verification and other cryptographic protocols.

## Algorithm

Computes: `result = (base^exponent) % modulus`

Using efficient algorithms:
- Right-to-left binary method
- Montgomery multiplication for large moduli
- Sliding window optimization

## EVM Precompile (0x05)

**Address:** `0x0000000000000000000000000000000000000005`
**Active Since:** Byzantium (EIP-198)

### Input Format

```
[0:32]    - base_length (bytes)
[32:64]   - exp_length (bytes)
[64:96]   - mod_length (bytes)
[96:...]  - base (base_length bytes)
[...:]    - exponent (exp_length bytes)
[...:]    - modulus (mod_length bytes)
```

All values are big-endian unsigned integers.

### Output Format

Result padded/truncated to `mod_length` bytes.

### Gas Calculation

Complex formula based on sizes:
```
gas = mult_complexity(max(base_len, mod_len)) * max(adj_exp_len, 1) / GQUADDIVISOR

where:
- mult_complexity(x) = x^2 if x <= 64, else x^2 + (x - 64) * 4
- adj_exp_len = adjusted exponent length (accounts for leading zeros)
- GQUADDIVISOR = 3 (Berlin+), 20 (pre-Berlin)
```

## TypeScript API

```typescript
import { Precompiles, Hardfork } from '@tevm/voltaire';

function modexp(
    base: bigint,
    exponent: bigint,
    modulus: bigint
): bigint {
    // Encode input
    const baseBytes = bigintToBytes(base);
    const expBytes = bigintToBytes(exponent);
    const modBytes = bigintToBytes(modulus);

    const input = new Uint8Array(96 + baseBytes.length + expBytes.length + modBytes.length);
    let offset = 0;

    // Lengths
    input.set(uint256ToBytes(BigInt(baseBytes.length)), offset);
    offset += 32;
    input.set(uint256ToBytes(BigInt(expBytes.length)), offset);
    offset += 32;
    input.set(uint256ToBytes(BigInt(modBytes.length)), offset);
    offset += 32;

    // Values
    input.set(baseBytes, offset);
    offset += baseBytes.length;
    input.set(expBytes, offset);
    offset += expBytes.length;
    input.set(modBytes, offset);

    // Execute precompile
    const result = Precompiles.execute('0x05', input, 100000n, Hardfork.CANCUN);

    if (!result.success) {
        throw new Error('ModExp failed');
    }

    return bytesToBigint(result.output);
}

// Usage
const result = modexp(
    123456789n,  // base
    65537n,      // exponent (common RSA public exponent)
    9876543210n  // modulus
);
```

## Use Cases

### RSA Signature Verification

```typescript
// Verify RSA signature: signature^e ≡ hash (mod n)
function verifyRSASignature(
    message: Uint8Array,
    signature: bigint,
    publicKey: { e: bigint; n: bigint }
): boolean {
    // Hash message (typically SHA-256)
    const messageHash = Sha256.hash(message);
    const hashInt = bytesToBigint(messageHash);

    // Verify: signature^e mod n == hash
    const computed = modexp(signature, publicKey.e, publicKey.n);

    return computed === hashInt;
}
```

### Diffie-Hellman Key Exchange

```typescript
// Compute g^x mod p
function dhExchange(g: bigint, x: bigint, p: bigint): bigint {
    return modexp(g, x, p);
}

// Example: Alice and Bob
const p = 23n;  // Prime modulus
const g = 5n;   // Generator

// Alice's private/public
const alicePrivate = 6n;
const alicePublic = dhExchange(g, alicePrivate, p);  // g^6 mod 23

// Bob's private/public
const bobPrivate = 15n;
const bobPublic = dhExchange(g, bobPrivate, p);  // g^15 mod 23

// Shared secret
const aliceShared = dhExchange(bobPublic, alicePrivate, p);  // (g^15)^6 mod 23
const bobShared = dhExchange(alicePublic, bobPrivate, p);    // (g^6)^15 mod 23
// aliceShared === bobShared
```

### Zero-Knowledge Proofs

```typescript
// Schnorr proof: Prove knowledge of x where y = g^x mod p
function generateSchnorrProof(
    g: bigint,
    x: bigint,  // Secret
    y: bigint,  // Public: y = g^x mod p
    p: bigint
): { commitment: bigint; response: bigint } {
    // Random commitment
    const r = randomBigint(p);
    const commitment = modexp(g, r, p);

    // Challenge (simulated - real implementation uses Fiat-Shamir)
    const challenge = 42n;  // In practice: hash(g, y, commitment)

    // Response: r + challenge * x
    const response = (r + challenge * x) % (p - 1n);

    return { commitment, response };
}

function verifySchnorrProof(
    g: bigint,
    y: bigint,
    proof: { commitment: bigint; response: bigint },
    p: bigint
): boolean {
    const challenge = 42n;

    // Verify: g^response == commitment * y^challenge (mod p)
    const left = modexp(g, proof.response, p);
    const right = (proof.commitment * modexp(y, challenge, p)) % p;

    return left === right;
}
```

## Implementation Notes

### Pure JavaScript Fallback

For non-EVM environments, use native JavaScript:

```typescript
function modexpJS(base: bigint, exp: bigint, mod: bigint): bigint {
    if (mod === 1n) return 0n;

    let result = 1n;
    base = base % mod;

    while (exp > 0n) {
        if (exp % 2n === 1n) {
            result = (result * base) % mod;
        }
        exp = exp / 2n;
        base = (base * base) % mod;
    }

    return result;
}
```

Note: Native implementation much slower than precompile for large numbers.

### Gas Optimization

For on-chain use, optimize gas by:
1. Minimizing input sizes (trim leading zeros)
2. Using smallest sufficient modulus
3. Considering alternative algorithms for small exponents

### Security

**Safe:**
- Well-tested algorithm (used in RSA for decades)
- Constant-time for same-size inputs (prevents timing attacks)

**Caution:**
- Not constant-time across different input sizes
- Use padding for size-sensitive operations

## Performance

**Precompile (0x05):**
- ~1000x faster than EVM bytecode for large numbers
- ~10x faster than pure JavaScript

**Benchmarks** (2048-bit RSA verify):
- EVM bytecode: ~5,000,000 gas
- ModExp precompile: ~20,000 gas
- Pure JavaScript: ~50ms

## Zig API

```zig
const crypto = @import("crypto");

// Zig has native modexp via std.math.big
const result = try crypto.modexp(allocator, base, exponent, modulus);
defer allocator.free(result);
```

## Testing

Test coverage in:
- `modexp.test.ts` - TypeScript tests
- `modexp.zig` - Zig tests
- EVM test vectors from Ethereum consensus tests

Test cases include:
- Small numbers (< 64 bytes)
- Large numbers (256-4096 bits)
- RSA common cases (e=65537)
- Edge cases (0, 1, modulus=1)

## References

- [EIP-198: Big Integer Modular Exponentiation](https://eips.ethereum.org/EIPS/eip-198)
- [EIP-2565: ModExp Gas Cost](https://eips.ethereum.org/EIPS/eip-2565) (Berlin changes)
- [RSA](https://en.wikipedia.org/wiki/RSA_(cryptosystem))
- [Modular Exponentiation](https://en.wikipedia.org/wiki/Modular_exponentiation)
- [Montgomery Multiplication](https://en.wikipedia.org/wiki/Montgomery_modular_multiplication)
