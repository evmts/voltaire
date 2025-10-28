# EVM Precompiled Contracts

Complete implementation of all 19 Ethereum precompiled contracts.

## Overview

Precompiled contracts are special Ethereum addresses (0x01-0x13) that execute optimized native operations. They provide complex cryptographic operations at lower gas cost than equivalent EVM bytecode.

## TypeScript API

```typescript
import { Precompiles, Hardfork } from '@tevm/voltaire';

// Check if address is a precompile
const isPrecompile = Precompiles.isPrecompile('0x01', Hardfork.CANCUN);  // true

// Execute precompile
const result = Precompiles.execute(
    '0x01',           // Address (ecrecover)
    input,            // Input data (Uint8Array)
    gasLimit,         // Gas limit
    Hardfork.CANCUN   // EVM hardfork
);

if (result.success) {
    console.log('Output:', result.output);
    console.log('Gas used:', result.gasUsed);
} else {
    console.error('Error:', result.error);
}
```

## Precompile Reference

### 0x01: ECRecover

Recovers signer address from ECDSA signature.

**Gas:** 3000
**Input:** 128 bytes (hash, v, r, s)
**Output:** 32 bytes (address, left-padded)

```typescript
const input = new Uint8Array(128);
// input[0:32]   = message hash
// input[32:64]  = v (recovery id)
// input[64:96]  = r (signature component)
// input[96:128] = s (signature component)

const result = Precompiles.execute('0x01', input, 3000n, hardfork);
const address = result.output.slice(12, 32);  // Last 20 bytes
```

**Use Cases:**
- Signature verification
- Authentication
- Multi-sig wallets

### 0x02: SHA256

Computes SHA-256 hash.

**Gas:** 60 + 12 * ⌈inputLen / 32⌉
**Input:** Any length
**Output:** 32 bytes (hash)

```typescript
const input = new TextEncoder().encode('hello world');
const result = Precompiles.execute('0x02', input, 100n, hardfork);
const hash = result.output;  // 32-byte SHA-256
```

**Use Cases:**
- Bitcoin interoperability
- Legacy hash verification
- Cross-chain bridges

### 0x03: RIPEMD160

Computes RIPEMD-160 hash.

**Gas:** 600 + 120 * ⌈inputLen / 32⌉
**Input:** Any length
**Output:** 32 bytes (20-byte hash, left-padded)

```typescript
const input = new Uint8Array([1, 2, 3]);
const result = Precompiles.execute('0x03', input, 700n, hardfork);
const hash = result.output.slice(12);  // Last 20 bytes
```

**Use Cases:**
- Bitcoin address generation
- Legacy systems
- Cross-chain protocols

### 0x04: Identity

Returns input unchanged (data copy).

**Gas:** 15 + 3 * ⌈inputLen / 32⌉
**Input:** Any length
**Output:** Same as input

```typescript
const input = new Uint8Array([1, 2, 3, 4, 5]);
const result = Precompiles.execute('0x04', input, 20n, hardfork);
// result.output === input
```

**Use Cases:**
- Memory copying
- Gas-efficient data passing
- Contract optimization

### 0x05: ModExp

Modular exponentiation: (base^exp) % mod.

**Gas:** Complex calculation based on input sizes
**Input:** Variable (base length, exp length, mod length, data)
**Output:** mod length bytes (result)

```typescript
// Input format:
// [0:32]    = base length (bytes)
// [32:64]   = exp length (bytes)
// [64:96]   = mod length (bytes)
// [96:]     = base || exp || mod (concatenated)

const input = new Uint8Array([
    ...uint256ToBytes(32n),   // base length
    ...uint256ToBytes(32n),   // exp length
    ...uint256ToBytes(32n),   // mod length
    ...base,                  // 32 bytes
    ...exponent,              // 32 bytes
    ...modulus,               // 32 bytes
]);

const result = Precompiles.execute('0x05', input, 200n, hardfork);
```

**Use Cases:**
- RSA verification
- Zero-knowledge proofs
- Cryptographic protocols

### 0x06: BN254 Add (alt_bn128)

Adds two points on the BN254 elliptic curve.

**Gas:** 150 (Berlin+), 500 (Istanbul)
**Input:** 128 bytes (two G1 points)
**Output:** 64 bytes (resulting G1 point)

```typescript
const input = new Uint8Array(128);
// [0:32]    = x1
// [32:64]   = y1
// [64:96]   = x2
// [96:128]  = y2

const result = Precompiles.execute('0x06', input, 150n, Hardfork.BERLIN);
// result.output = x3 || y3 (64 bytes)
```

**Use Cases:**
- zkSNARKs (Groth16, PLONK)
- Privacy protocols (Tornado Cash)
- Rollup proofs (zkSync, Aztec)

### 0x07: BN254 Scalar Mul

Multiplies BN254 point by scalar.

**Gas:** 6000 (Berlin+), 40000 (Istanbul)
**Input:** 96 bytes (G1 point + scalar)
**Output:** 64 bytes (resulting G1 point)

```typescript
const input = new Uint8Array(96);
// [0:32]   = x
// [32:64]  = y
// [64:96]  = scalar

const result = Precompiles.execute('0x07', input, 6000n, Hardfork.BERLIN);
```

**Use Cases:**
- zkSNARK proof verification
- Commitment schemes
- Cryptographic accumulators

### 0x08: BN254 Pairing Check

Verifies pairing equation for zkSNARK verification.

**Gas:** 45000 + 34000 * k (k = number of pairs)
**Input:** 192k bytes (k pairs of G1 and G2 points)
**Output:** 32 bytes (1 if valid, 0 if invalid)

```typescript
// Input: pairs of (G1 point, G2 point)
// Each G1 point: 64 bytes (x, y)
// Each G2 point: 128 bytes (x1, x2, y1, y2)

const input = new Uint8Array(192);  // 1 pair
// [0:64]     = G1 point
// [64:192]   = G2 point

const result = Precompiles.execute('0x08', input, 79000n, hardfork);
const isValid = result.output[31] === 1;
```

**Use Cases:**
- zkSNARK verification (Groth16)
- Zero-knowledge proof systems
- Privacy-preserving protocols

### 0x09: Blake2F

Blake2b compression function.

**Gas:** rounds (from input)
**Input:** 213 bytes (rounds, state, message, offsets, final flag)
**Output:** 64 bytes (compressed state)

```typescript
const input = new Uint8Array(213);
// [0:4]      = rounds (big-endian u32)
// [4:68]     = h (state vector, 8x u64)
// [68:196]   = m (message block, 16x u64)
// [196:212]  = t (offset counters, 2x u64)
// [212]      = f (final block flag, 0 or 1)

const result = Precompiles.execute('0x09', input, rounds, hardfork);
```

**Use Cases:**
- Zcash Sapling interoperability
- Blake2 hash verification
- Cross-chain bridges

### 0x0a: Point Evaluation (KZG)

KZG polynomial commitment verification for EIP-4844 (blob transactions).

**Gas:** 50000
**Input:** 192 bytes (versioned hash, z, y, commitment, proof)
**Output:** 64 bytes (powers of z) or empty on failure
**Active:** Cancun hardfork (EIP-4844)

```typescript
const input = new Uint8Array(192);
// [0:32]     = versioned_hash
// [32:64]    = z (evaluation point)
// [64:96]    = y (claimed value)
// [96:144]   = commitment (48 bytes)
// [144:192]  = proof (48 bytes)

const result = Precompiles.execute('0x0a', input, 50000n, Hardfork.CANCUN);
```

**Use Cases:**
- Blob transaction verification
- Data availability sampling
- Layer 2 scalability

### BLS12-381 Precompiles (0x0b-0x13)

**Active:** Prague hardfork (EIP-2537)

#### 0x0b: BLS12 G1 Add
**Gas:** 500
**Input:** 256 bytes (two G1 points)
**Output:** 128 bytes (result G1 point)

#### 0x0c: BLS12 G1 Mul
**Gas:** 12000
**Input:** 160 bytes (G1 point + scalar)
**Output:** 128 bytes (result G1 point)

#### 0x0d: BLS12 G1 MSM
**Gas:** 12000k (k = number of pairs)
**Input:** 160k bytes (k G1 points and scalars)
**Output:** 128 bytes (result G1 point)

Multi-scalar multiplication: Σ(scalar_i * point_i)

#### 0x0e: BLS12 G2 Add
**Gas:** 800
**Input:** 512 bytes (two G2 points)
**Output:** 256 bytes (result G2 point)

#### 0x0f: BLS12 G2 Mul
**Gas:** 45000
**Input:** 288 bytes (G2 point + scalar)
**Output:** 256 bytes (result G2 point)

#### 0x10: BLS12 G2 MSM
**Gas:** 45000k (k = number of pairs)
**Input:** 288k bytes (k G2 points and scalars)
**Output:** 256 bytes (result G2 point)

#### 0x11: BLS12 Pairing
**Gas:** 115000 + 23000k (k = number of pairs)
**Input:** 384k bytes (k pairs of G1 and G2 points)
**Output:** 32 bytes (1 if valid, 0 if invalid)

#### 0x12: BLS12 Map Fp to G1
**Gas:** 5500
**Input:** 64 bytes (field element)
**Output:** 128 bytes (G1 point)

#### 0x13: BLS12 Map Fp2 to G2
**Gas:** 75000
**Input:** 128 bytes (Fp2 element)
**Output:** 256 bytes (G2 point)

**BLS12-381 Use Cases:**
- Ethereum 2.0 signature verification
- BLS signature aggregation
- Threshold cryptography
- Advanced zero-knowledge proofs

## Gas Calculation

```typescript
function estimatePrecompileGas(address: string, inputLength: number, hardfork: Hardfork): bigint {
    switch (address) {
        case '0x01': return 3000n;
        case '0x02': return 60n + 12n * BigInt(Math.ceil(inputLength / 32));
        case '0x03': return 600n + 120n * BigInt(Math.ceil(inputLength / 32));
        case '0x04': return 15n + 3n * BigInt(Math.ceil(inputLength / 32));
        case '0x05': return calculateModExpGas(input);  // Complex
        case '0x06': return hardfork >= Hardfork.BERLIN ? 150n : 500n;
        case '0x07': return hardfork >= Hardfork.BERLIN ? 6000n : 40000n;
        case '0x08': {
            const k = inputLength / 192;
            return 45000n + 34000n * BigInt(k);
        }
        case '0x09': return BigInt(readUInt32BE(input, 0));  // rounds
        case '0x0a': return 50000n;  // KZG
        // BLS12-381 precompiles...
        default: throw new Error('Unknown precompile');
    }
}
```

## Hardfork Availability

| Address | Name | Available Since | Notes |
|---------|------|-----------------|-------|
| 0x01 | ECRecover | Frontier | Always available |
| 0x02 | SHA256 | Frontier | Always available |
| 0x03 | RIPEMD160 | Frontier | Always available |
| 0x04 | Identity | Frontier | Always available |
| 0x05 | ModExp | Byzantium | EIP-198 |
| 0x06 | BN254 Add | Byzantium | EIP-196, gas reduced in Berlin |
| 0x07 | BN254 Mul | Byzantium | EIP-196, gas reduced in Berlin |
| 0x08 | BN254 Pairing | Byzantium | EIP-197, gas reduced in Berlin |
| 0x09 | Blake2F | Istanbul | EIP-152 |
| 0x0a | Point Evaluation | Cancun | EIP-4844 (blobs) |
| 0x0b-0x13 | BLS12-381 | Prague | EIP-2537 |

## Error Handling

Precompiles can fail in several ways:

```typescript
const result = Precompiles.execute(address, input, gasLimit, hardfork);

if (!result.success) {
    switch (result.error) {
        case 'OutOfGas':
            // Gas limit exceeded
            break;
        case 'InvalidInput':
            // Input format/length invalid
            break;
        case 'NotAvailable':
            // Precompile not active in hardfork
            break;
        case 'ExecutionError':
            // Crypto operation failed (invalid point, etc.)
            break;
    }
}
```

## Implementation Architecture

**TypeScript:** src/precompiles/precompiles.ts
- Gas cost calculations
- Input validation
- Dispatch to crypto libraries

**Zig:** Native implementations for all precompiles
- Optimized math operations
- FFI bindings to external libraries (BLST, c-kzg-4844)

**External Libraries:**
- **BLST** - BLS12-381 operations (audited, production-ready)
- **c-kzg-4844** - KZG commitments (audited, Ethereum Foundation)
- **Arkworks** - BN254 operations (audited, Rust)

## Examples

### Verify zkSNARK Proof

```typescript
import { Precompiles, Hardfork } from '@tevm/voltaire';

function verifyGroth16Proof(
    proof: { a: Point; b: Point; c: Point },
    inputs: bigint[],
    vk: VerifyingKey
): boolean {
    // Prepare pairing check: e(A, B) = e(α, β) * e(L, γ) * e(C, δ)
    const pairingInput = preparePairingInput(proof, inputs, vk);

    const result = Precompiles.execute(
        '0x08',  // BN254 pairing
        pairingInput,
        200000n,  // Gas limit
        Hardfork.CANCUN
    );

    if (!result.success) return false;
    return result.output[31] === 1;  // Last byte is result
}
```

### Recover Signer from Signature

```typescript
function recoverSigner(messageHash: Uint8Array, signature: { r: Uint8Array; s: Uint8Array; v: number }): string {
    const input = new Uint8Array(128);
    input.set(messageHash, 0);
    input[63] = signature.v;  // v at byte 63
    input.set(signature.r, 64);
    input.set(signature.s, 96);

    const result = Precompiles.execute('0x01', input, 3000n, Hardfork.CANCUN);

    if (!result.success) throw new Error('Recovery failed');

    const address = result.output.slice(12, 32);  // Last 20 bytes
    return '0x' + Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## Testing

Comprehensive test coverage in:
- `precompiles.test.ts` - TypeScript unit tests
- `precompiles.zig` - Zig unit tests
- `bench/precompiles/` - Performance benchmarks

Test vectors from:
- Ethereum consensus tests
- EIP reference implementations
- Known proof systems (Groth16, PLONK)

## References

- [EIP-196: Precompiled contracts for addition and scalar multiplication on alt_bn128](https://eips.ethereum.org/EIPS/eip-196)
- [EIP-197: Precompiled contracts for optimal ate pairing check](https://eips.ethereum.org/EIPS/eip-197)
- [EIP-198: Big integer modular exponentiation](https://eips.ethereum.org/EIPS/eip-198)
- [EIP-152: Add BLAKE2 compression function F precompile](https://eips.ethereum.org/EIPS/eip-152)
- [EIP-2537: BLS12-381 curve operations](https://eips.ethereum.org/EIPS/eip-2537)
- [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)
