# Hash

32-byte Keccak-256 hash type with constant-time comparison.

## Overview

`Hash` represents a 32-byte Keccak-256 hash value as a branded `Uint8Array`. This is Ethereum's primary hash function used throughout the protocol.

## Type Definition

```typescript
type Hash = Uint8Array & { __brand: typeof hashSymbol };
```

## API

### Creation

```typescript
import { Hash, Keccak256 } from '@tevm/primitives';

// From hex string (66 chars: "0x" + 64 hex)
const hash = Hash.fromHex('0x1234567890abcdef...');

// From bytes (32-byte Uint8Array)
const hash = Hash.fromBytes(bytes);

// Compute Keccak-256 hash
const hash = Keccak256.hash(data);  // data: Uint8Array
const hash = Keccak256.hashString('hello');  // UTF-8 encoded
const hash = Keccak256.hashHex('0x1234');  // Hex-decoded
```

### Conversion

```typescript
// To hex string (66 chars with "0x" prefix)
const hex = Hash.toHex.call(hash);  // "0x1234...def"

// To bytes (returns same Uint8Array)
const bytes = Hash.toBytes.call(hash);

// To string (alias for toHex)
const str = Hash.toString.call(hash);
```

### Comparison

```typescript
// Constant-time equality check
const equal = Hash.equals.call(hash1, hash2);

// Check if zero hash
const isZero = Hash.isZero.call(hash);  // All 32 bytes are 0x00

// Non-constant time comparison for sorting
const cmp = Hash.compare(hash1, hash2);  // -1, 0, or 1
```

### Utilities

```typescript
// Generate random hash (cryptographically secure)
const random = Hash.random();

// Clone hash
const copy = Hash.clone.call(hash);

// Slice hash (returns new Hash if 32 bytes, else Uint8Array)
const slice = Hash.slice.call(hash, 0, 32);

// Format for display
const formatted = Hash.format.call(hash);  // "0x1234...cdef" (shortened)
```

## Keccak-256 Hash Function

Ethereum uses Keccak-256 (not SHA3-256, despite common confusion):

```typescript
import { Keccak256 } from '@tevm/primitives';

// Hash raw bytes
const data = new Uint8Array([1, 2, 3]);
const hash = Keccak256.hash(data);

// Hash UTF-8 string
const messageHash = Keccak256.hashString('hello world');

// Hash hex-encoded data
const hexHash = Keccak256.hashHex('0xdeadbeef');

// Empty hash constant
const emptyHash = Keccak256.EMPTY_HASH;  // keccak256('')
```

## Constant-Time Comparison

Security-critical operations use constant-time comparison to prevent timing attacks:

```typescript
// ✅ Constant-time (secure)
const isValid = Hash.equals.call(expectedHash, computedHash);

// ❌ Not constant-time (timing leak)
const isValid = expectedHash.every((byte, i) => byte === computedHash[i]);
```

The constant-time implementation prevents attackers from learning information through execution time differences.

## Common Hash Uses

### Function Selectors

First 4 bytes of function signature hash:

```typescript
const signature = 'transfer(address,uint256)';
const hash = Keccak256.hashString(signature);
const selector = hash.slice(0, 4);  // 0xa9059cbb
```

### Event Topics

Event signatures as topic0:

```typescript
const signature = 'Transfer(address,address,uint256)';
const topic0 = Keccak256.hashString(signature);
// topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```

### Merkle Trees

Hash pairs to build Merkle trees:

```typescript
function hashPair(left: Hash, right: Hash): Hash {
    const combined = new Uint8Array(64);
    combined.set(left, 0);
    combined.set(right, 32);
    return Keccak256.hash(combined);
}

const root = hashPair(leaf1Hash, leaf2Hash);
```

### Storage Keys

EVM storage slot hashing:

```typescript
function computeStorageKey(address: Address, slot: bigint): Hash {
    const data = new Uint8Array(52);
    data.set(address, 0);              // 20 bytes
    data.set(uint256ToBytes(slot), 20); // 32 bytes
    return Keccak256.hash(data);
}
```

## Examples

### Verify Data Integrity

```typescript
import { Hash, Keccak256 } from '@tevm/primitives';

function verifyDataIntegrity(data: Uint8Array, expectedHash: Hash): boolean {
    const actualHash = Keccak256.hash(data);
    return Hash.equals.call(expectedHash, actualHash);
}

// Usage
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = Keccak256.hash(data);

// Later, verify data wasn't tampered with
if (verifyDataIntegrity(data, hash)) {
    console.log('Data integrity verified');
} else {
    console.error('Data was modified!');
}
```

### Build Merkle Proof

```typescript
function buildMerkleProof(leaves: Hash[], index: number): Hash[] {
    const proof: Hash[] = [];
    let currentIndex = index;

    while (leaves.length > 1) {
        const nextLevel: Hash[] = [];

        for (let i = 0; i < leaves.length; i += 2) {
            if (i + 1 < leaves.length) {
                // Pair exists
                if (i === currentIndex || i + 1 === currentIndex) {
                    // Save sibling for proof
                    proof.push(i === currentIndex ? leaves[i + 1] : leaves[i]);
                }
                nextLevel.push(hashPair(leaves[i], leaves[i + 1]));
            } else {
                // Odd leaf, promote to next level
                nextLevel.push(leaves[i]);
            }
        }

        currentIndex = Math.floor(currentIndex / 2);
        leaves = nextLevel;
    }

    return proof;
}
```

### EIP-191 Message Hashing

```typescript
import { Keccak256 } from '@tevm/primitives';

function hashEIP191Message(message: string): Hash {
    const prefix = '\x19Ethereum Signed Message:\n';
    const messageBytes = new TextEncoder().encode(message);
    const lengthBytes = new TextEncoder().encode(messageBytes.length.toString());

    const combined = new Uint8Array(
        prefix.length + lengthBytes.length + messageBytes.length
    );

    let offset = 0;
    combined.set(new TextEncoder().encode(prefix), offset);
    offset += prefix.length;
    combined.set(lengthBytes, offset);
    offset += lengthBytes.length;
    combined.set(messageBytes, offset);

    return Keccak256.hash(combined);
}

// Usage
const msgHash = hashEIP191Message('Sign this message');
```

### Content-Addressable Storage

```typescript
class ContentStore {
    private store = new Map<string, Uint8Array>();

    put(data: Uint8Array): Hash {
        const hash = Keccak256.hash(data);
        const key = Hash.toHex.call(hash);
        this.store.set(key, data);
        return hash;
    }

    get(hash: Hash): Uint8Array | undefined {
        const key = Hash.toHex.call(hash);
        return this.store.get(key);
    }

    has(hash: Hash): boolean {
        const key = Hash.toHex.call(hash);
        return this.store.has(key);
    }
}

// Usage
const store = new ContentStore();
const content = new TextEncoder().encode('Hello, world!');
const hash = store.put(content);

// Later retrieve by hash
const retrieved = store.get(hash);
```

## Implementation Notes

### Data-First Architecture

`Hash` is a branded `Uint8Array`, not a class:

```typescript
// ✅ Good - data-first
const hash: Hash = Keccak256.hash(data);
const hex = Hash.toHex.call(hash);

// ❌ Not available - no classes
const hash = new Hash(bytes);  // Doesn't exist
hash.toHex();  // Doesn't exist
```

### Performance

- Keccak-256 uses hardware acceleration when available
- Constant-time comparison is ~32 XOR operations
- All hash operations are single-pass
- No unnecessary copies (zero-copy where possible)

### Zero Hash

Special value with all bytes set to 0x00:

```typescript
const zero = Hash.zero();  // 0x0000...0000 (32 bytes)
const isZero = Hash.isZero.call(someHash);
```

Used for:
- Empty trie nodes
- Uninitialized storage
- Default/placeholder values

### Keccak vs SHA3

**Important:** Ethereum uses **Keccak-256**, not SHA3-256!

- SHA3-256 is the NIST standard (finalized in 2015)
- Keccak-256 is the original submission to NIST (2012)
- They produce different outputs for the same input
- Ethereum predates SHA3 finalization

```typescript
// ✅ Ethereum (Keccak-256)
const ethHash = Keccak256.hash(data);

// ❌ Not Ethereum (SHA3-256)
// import sha3 from 'js-sha3';
// const sha3Hash = sha3.sha3_256(data);  // Different result!
```

## Zig API

```zig
const primitives = @import("primitives");
const Hash = primitives.Hash;
const Keccak256 = primitives.Keccak256;

// Creation
const hash = try Hash.fromHex("0x1234...");
const hash2 = try Hash.fromBytes(&bytes);

// Compute hash
const data_hash = Keccak256.hash("hello world");
const byte_hash = try Keccak256.hashBytes(allocator, &bytes);
defer allocator.free(byte_hash);

// Conversion
const hex = hash.toHex();
const bytes = hash.toBytes();

// Comparison
const is_equal = hash1.equals(hash2);
const is_zero = hash.isZero();

// Utilities
const random = try Hash.random(allocator);
defer allocator.free(random);

const cloned = try hash.clone(allocator);
defer allocator.free(cloned);
```

## Security Considerations

1. **Constant-time comparison**: Always use `Hash.equals()` for security-sensitive comparisons
2. **Preimage resistance**: Computationally infeasible to find input for given hash
3. **Collision resistance**: Computationally infeasible to find two inputs with same hash
4. **Second preimage resistance**: Given input, infeasible to find different input with same hash

## Testing

Comprehensive test coverage in:
- `hash.test.ts` - TypeScript unit tests
- `hash.zig` - Zig unit tests (20+ test blocks)

Test vectors include:
- Empty input
- Known test vectors (NIST, Ethereum)
- Long inputs (1MB+)
- Constant-time comparison verification
- Edge cases (all zeros, all ones, random)

## References

- [Keccak Team](https://keccak.team/) - Original Keccak specification
- [FIPS 202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf) - SHA-3 Standard (differs from Keccak!)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Uses Keccak-256 throughout
- [EIP-191](https://eips.ethereum.org/EIPS/eip-191) - Signed Data Standard (message hashing)
