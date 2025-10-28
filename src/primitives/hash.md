# Hash

32-byte hash values with Keccak-256 hashing, encoding/decoding, and secure comparison utilities.

## Overview

Hash represents fixed 32-byte (256-bit) hash values commonly used in Ethereum for transaction IDs, block hashes, state roots, and cryptographic digests. Includes Keccak-256 hashing functions and constant-time comparison to prevent timing attacks.

**Key Features:**
- Type-safe 32-byte hash representation
- Keccak-256 hashing for bytes, strings, and hex
- Constant-time comparison (timing attack resistant)
- Zero-copy conversions
- Validation and type guards

**When to Use:**
- Transaction hashes and block hashes
- Merkle tree roots and proofs
- Content addressing and verification
- Cryptographic commitments
- Data integrity checks

## Quick Start

```typescript
import { Hash } from '@tevm/voltaire';

// Create from hex
const hash = Hash.fromHex('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

// Hash data with Keccak-256
const data = new Uint8Array([1, 2, 3, 4]);
const digest = Hash.keccak256(data);

// Hash string
const stringHash = Hash.keccak256String('hello world');

// Compare hashes (constant-time)
const same = Hash.equals.call(hash1, hash2);

// Convert to hex
const hex = Hash.toHex.call(hash);
console.log(hex); // "0x1234..."

// Check if zero hash
if (Hash.isZero.call(hash)) {
  console.log('Empty hash');
}
```

## Core Type

### Hash

32-byte hash value represented as branded Uint8Array.

```typescript
type Hash = Uint8Array & { __brand: typeof Hash.hashSymbol };
```

**Properties:**
- Length: Always 32 bytes (256 bits)
- Immutable: Should be treated as immutable
- Brand: Type-branded for safety

```typescript
const hash: Hash = Hash.fromHex('0x...');
console.log(hash.length); // 32
console.log(hash[0]); // First byte
```

## Constants

### SIZE

Hash size in bytes.

```typescript
Hash.SIZE = 32;
```

```typescript
const buffer = new Uint8Array(Hash.SIZE);
// Create 32-byte buffer
```

### ZERO

Zero hash constant (32 zero bytes).

```typescript
Hash.ZERO: Hash
```

```typescript
// Compare against empty hash
if (Hash.equals.call(hash, Hash.ZERO)) {
  console.log('Hash is empty');
}

// Use as placeholder
const placeholder = Hash.ZERO;
```

### hashSymbol

Brand symbol for type safety.

```typescript
Hash.hashSymbol: symbol
```

## Creation Functions

### fromHex

Create Hash from hex string.

```typescript
Hash.fromHex(hex: string): Hash
```

**Parameters:**
- `hex` - Hex string with or without 0x prefix (must be 64 hex chars)

**Returns:** Hash bytes

**Throws:** If hex is invalid or wrong length

```typescript
// With 0x prefix
const hash1 = Hash.fromHex('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

// Without 0x prefix
const hash2 = Hash.fromHex('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

// Invalid length throws
try {
  Hash.fromHex('0x1234'); // Too short
} catch (e) {
  console.error('Invalid hash length');
}

// Invalid characters throw
try {
  Hash.fromHex('0xGGGG...'); // Invalid hex
} catch (e) {
  console.error('Invalid hex string');
}
```

### fromBytes

Create Hash from raw bytes.

```typescript
Hash.fromBytes(bytes: Uint8Array): Hash
```

**Parameters:**
- `bytes` - Raw bytes (must be exactly 32 bytes)

**Returns:** Hash bytes (new copy)

**Throws:** If bytes is wrong length

```typescript
const bytes = new Uint8Array(32);
bytes.fill(0xff);
const hash = Hash.fromBytes(bytes);

// Wrong length throws
try {
  Hash.fromBytes(new Uint8Array(16)); // Too short
} catch (e) {
  console.error('Hash must be 32 bytes');
}
```

### from

Create Hash from string (alias for fromHex).

```typescript
Hash.from(value: string): Hash
```

```typescript
const hash = Hash.from('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
// Same as fromHex
```

## Conversion Functions

### toHex

Convert Hash to hex string.

```typescript
Hash.toHex.call(hash: Hash): string
```

**Returns:** Hex string with 0x prefix

```typescript
const hash = Hash.fromBytes(new Uint8Array(32).fill(0xff));
const hex = Hash.toHex.call(hash);
console.log(hex);
// "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
```

### toBytes

Convert Hash to raw bytes.

```typescript
Hash.toBytes.call(hash: Hash): Uint8Array
```

**Returns:** New copy of hash bytes

```typescript
const hash = Hash.fromHex('0x1234...');
const bytes = Hash.toBytes.call(hash);
console.log(bytes.length); // 32
```

### toString

Convert Hash to string (alias for toHex).

```typescript
Hash.toString.call(hash: Hash): string
```

```typescript
const str = Hash.toString.call(hash);
console.log(str); // "0x1234..."
```

## Comparison Functions

### equals

Compare two hashes for equality.

```typescript
Hash.equals.call(hash1: Hash, hash2: Hash): boolean
```

**Uses constant-time comparison to prevent timing attacks.**

**Returns:** True if hashes are equal

```typescript
const hash1 = Hash.keccak256String('hello');
const hash2 = Hash.keccak256String('hello');
const hash3 = Hash.keccak256String('world');

console.log(Hash.equals.call(hash1, hash2)); // true
console.log(Hash.equals.call(hash1, hash3)); // false

// Constant-time: execution time doesn't leak information
// about where hashes differ
```

**Security:** Prevents timing side-channel attacks by using constant-time byte comparison.

### isZero

Check if hash is zero hash.

```typescript
Hash.isZero.call(hash: Hash): boolean
```

**Returns:** True if hash is all zeros

```typescript
const zero = Hash.ZERO;
const nonZero = Hash.keccak256String('data');

console.log(Hash.isZero.call(zero));    // true
console.log(Hash.isZero.call(nonZero)); // false

// Constant-time comparison
```

## Validation Functions

### isHash

Check if value is a valid Hash.

```typescript
Hash.isHash(value: unknown): value is Hash
```

**Returns:** True if value is Hash type

```typescript
const hash = Hash.fromHex('0x1234...');
const notHash = new Uint8Array(16);

console.log(Hash.isHash(hash));    // true
console.log(Hash.isHash(notHash)); // false (wrong length)
console.log(Hash.isHash('0x...')); // false (not Uint8Array)

if (Hash.isHash(value)) {
  // TypeScript knows value is Hash
  const hex = Hash.toHex.call(value);
}
```

### isValidHex

Validate hex string is valid hash format.

```typescript
Hash.isValidHex(hex: string): boolean
```

**Returns:** True if valid hash hex format (64 hex chars)

```typescript
console.log(Hash.isValidHex('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')); // true
console.log(Hash.isValidHex('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'));   // true
console.log(Hash.isValidHex('0x1234'));     // false (too short)
console.log(Hash.isValidHex('0xGGGG...')); // false (invalid chars)

// Use for validation before parsing
if (Hash.isValidHex(userInput)) {
  const hash = Hash.fromHex(userInput);
}
```

### assert

Assert value is a Hash, throws if not.

```typescript
Hash.assert(value: unknown, message?: string): asserts value is Hash
```

**Parameters:**
- `value` - Value to assert
- `message` - Optional error message

**Throws:** If value is not a Hash

```typescript
function processHash(value: unknown) {
  Hash.assert(value, 'Expected hash value');
  // TypeScript knows value is Hash after this line
  const hex = Hash.toHex.call(value);
}

try {
  Hash.assert(notHash);
} catch (e) {
  console.error(e.message); // "Value is not a Hash"
}

Hash.assert(hash, 'Custom error'); // Custom message
```

## Hashing Functions

### keccak256

Hash data with Keccak-256.

```typescript
Hash.keccak256(data: Uint8Array): Hash
```

**Parameters:**
- `data` - Bytes to hash

**Returns:** 32-byte Keccak-256 hash

```typescript
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = Hash.keccak256(data);
console.log(Hash.toHex.call(hash));

// Hash transaction data
const txData = new Uint8Array(rlpEncodedTx);
const txHash = Hash.keccak256(txData);

// Hash ABI encoded parameters
const encoded = encodeAbiParameters([...]);
const paramHash = Hash.keccak256(encoded);
```

**Note:** Uses Keccak-256 (SHA-3 variant), not standard SHA-256.

### keccak256String

Hash string with Keccak-256.

```typescript
Hash.keccak256String(str: string): Hash
```

**Parameters:**
- `str` - String to hash (UTF-8 encoded)

**Returns:** 32-byte Keccak-256 hash

```typescript
// Hash event signatures
const eventSig = Hash.keccak256String('Transfer(address,address,uint256)');
console.log(Hash.toHex.call(eventSig));

// Hash function selectors
const funcSig = Hash.keccak256String('transfer(address,uint256)');
const selector = Hash.slice.call(funcSig, 0, 4); // First 4 bytes

// Hash human-readable data
const message = 'Hello, Ethereum!';
const messageHash = Hash.keccak256String(message);
```

**Note:** Encodes string as UTF-8 before hashing.

### keccak256Hex

Hash hex string with Keccak-256.

```typescript
Hash.keccak256Hex(hex: string): Hash
```

**Parameters:**
- `hex` - Hex string to hash (with or without 0x prefix)

**Returns:** 32-byte Keccak-256 hash

**Throws:** If hex has odd length or invalid characters

```typescript
// Hash hex-encoded data
const hex = '0x1234567890abcdef';
const hash = Hash.keccak256Hex(hex);

// Hash address
const addressHex = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';
const addressHash = Hash.keccak256Hex(addressHex);

// Without 0x prefix
const hash2 = Hash.keccak256Hex('deadbeef');

// Odd length throws
try {
  Hash.keccak256Hex('0x123'); // Odd length
} catch (e) {
  console.error('Hex string must have even length');
}
```

## Utility Functions

### random

Generate random hash.

```typescript
Hash.random(): Hash
```

**Returns:** Random 32-byte hash

**Throws:** If crypto.getRandomValues not available

```typescript
// Generate random hash
const randomHash = Hash.random();

// Use for nonces or IDs
const nonce = Hash.random();
const requestId = Hash.random();

// Testing
const testHash = Hash.random();
```

**Security:** Uses `crypto.getRandomValues()` for cryptographically secure randomness.

### clone

Clone hash to new instance.

```typescript
Hash.clone.call(hash: Hash): Hash
```

**Returns:** New hash with same value

```typescript
const original = Hash.fromHex('0x1234...');
const copy = Hash.clone.call(original);

// Independent copies
console.log(Hash.equals.call(original, copy)); // true

// Modifications don't affect original
copy[0] = 0xff;
console.log(Hash.equals.call(original, copy)); // false
```

### slice

Get slice of hash bytes.

```typescript
Hash.slice.call(hash: Hash, start?: number, end?: number): Uint8Array
```

**Parameters:**
- `start` - Start index (inclusive)
- `end` - End index (exclusive)

**Returns:** Slice of hash bytes

```typescript
const hash = Hash.keccak256String('transfer(address,uint256)');

// Function selector (first 4 bytes)
const selector = Hash.slice.call(hash, 0, 4);
console.log(selector.length); // 4

// Last 8 bytes
const suffix = Hash.slice.call(hash, 24, 32);

// From index to end
const tail = Hash.slice.call(hash, 16);
console.log(tail.length); // 16
```

### format

Format hash for display (truncated).

```typescript
Hash.format.call(
  hash: Hash,
  prefixLength?: number,
  suffixLength?: number
): string
```

**Parameters:**
- `prefixLength` - Number of hex chars to show at start (default: 6)
- `suffixLength` - Number of hex chars to show at end (default: 4)

**Returns:** Formatted string like "0x1234...5678"

```typescript
const hash = Hash.keccak256String('data');

// Default formatting
console.log(Hash.format.call(hash));
// "0x5093dd...c2e4"

// Custom lengths
console.log(Hash.format.call(hash, 10, 6));
// "0x5093dd2c7f...87c2e4"

// Short hashes not truncated
const shortHash = Hash.fromHex('0x' + '12'.repeat(32));
console.log(Hash.format.call(shortHash, 70, 4));
// Shows full hash if length <= prefix + suffix + 2
```

**Use Cases:**
- UI display
- Logging
- Error messages
- Human-readable output

## Common Patterns

### Hashing Transaction Data

```typescript
function hashTransaction(tx: Transaction): Hash {
  // Serialize transaction
  const encoded = serializeTransaction(tx);

  // Hash with Keccak-256
  const txHash = Hash.keccak256(encoded);

  return txHash;
}

const tx = { /* transaction fields */ };
const txHash = hashTransaction(tx);
console.log(`Transaction: ${Hash.format.call(txHash)}`);
```

### Verifying Hash Equality

```typescript
function verifyDataIntegrity(
  data: Uint8Array,
  expectedHash: Hash
): boolean {
  const actualHash = Hash.keccak256(data);
  return Hash.equals.call(actualHash, expectedHash);
}

const data = fetchData();
const expected = Hash.fromHex('0x...');

if (verifyDataIntegrity(data, expected)) {
  console.log('Data integrity verified');
} else {
  console.error('Data corrupted!');
}
```

### Event Signature Hashing

```typescript
function getEventTopic(signature: string): Hash {
  return Hash.keccak256String(signature);
}

// Standard events
const transferTopic = getEventTopic('Transfer(address,address,uint256)');
const approvalTopic = getEventTopic('Approval(address,address,uint256)');

// Filter logs by topic
const logs = await getLogs({
  topics: [Hash.toHex.call(transferTopic)]
});
```

### Function Selector Computation

```typescript
function getFunctionSelector(signature: string): Uint8Array {
  const hash = Hash.keccak256String(signature);
  return Hash.slice.call(hash, 0, 4);
}

const transferSelector = getFunctionSelector('transfer(address,uint256)');
console.log(Array.from(transferSelector, b =>
  b.toString(16).padStart(2, '0')
).join('')); // "a9059cbb"
```

### Content Addressing

```typescript
class ContentStore {
  private data = new Map<string, Uint8Array>();

  store(content: Uint8Array): Hash {
    const hash = Hash.keccak256(content);
    const key = Hash.toHex.call(hash);
    this.data.set(key, content);
    return hash;
  }

  retrieve(hash: Hash): Uint8Array | undefined {
    const key = Hash.toHex.call(hash);
    return this.data.get(key);
  }

  verify(content: Uint8Array, hash: Hash): boolean {
    const computed = Hash.keccak256(content);
    return Hash.equals.call(computed, hash);
  }
}

const store = new ContentStore();
const data = new Uint8Array([1, 2, 3]);
const hash = store.store(data);
const retrieved = store.retrieve(hash);
```

### Merkle Tree Hashing

```typescript
function hashPair(left: Hash, right: Hash): Hash {
  // Combine hashes
  const combined = new Uint8Array(64);
  combined.set(left, 0);
  combined.set(right, 32);

  // Hash combination
  return Hash.keccak256(combined);
}

function buildMerkleRoot(leaves: Hash[]): Hash {
  if (leaves.length === 0) return Hash.ZERO;
  if (leaves.length === 1) return leaves[0];

  const nextLevel: Hash[] = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i];
    const right = leaves[i + 1] ?? left; // Duplicate if odd
    nextLevel.push(hashPair(left, right));
  }

  return buildMerkleRoot(nextLevel);
}

const leafHashes = data.map(item => Hash.keccak256(item));
const root = buildMerkleRoot(leafHashes);
```

### Hash Map Keys

```typescript
class HashSet {
  private hashes = new Set<string>();

  add(hash: Hash): void {
    this.hashes.add(Hash.toHex.call(hash));
  }

  has(hash: Hash): boolean {
    return this.hashes.has(Hash.toHex.call(hash));
  }

  delete(hash: Hash): boolean {
    return this.hashes.delete(Hash.toHex.call(hash));
  }

  get size(): number {
    return this.hashes.size;
  }
}

const set = new HashSet();
set.add(Hash.keccak256String('foo'));
set.add(Hash.keccak256String('bar'));
console.log(set.size); // 2
```

## Security Considerations

### Constant-Time Comparison

Hash comparison uses constant-time algorithm to prevent timing attacks:

```typescript
// Good: Use provided equals function
const same = Hash.equals.call(hash1, hash2);

// Bad: Direct comparison leaks timing information
const bad = hash1.every((b, i) => b === hash2[i]); // DON'T DO THIS

// Bad: Early return leaks where hashes differ
function unsafeEquals(a: Hash, b: Hash): boolean {
  for (let i = 0; i < 32; i++) {
    if (a[i] !== b[i]) return false; // Timing leak!
  }
  return true;
}
```

**Why It Matters:**
- Timing differences reveal information about hash values
- Critical for comparing secret hashes or HMAC tags
- Constant-time comparison always takes same time regardless of input

### Hash Validation

Always validate untrusted hash inputs:

```typescript
// Good: Validate before using
function processHash(input: unknown): void {
  if (!Hash.isHash(input)) {
    throw new Error('Invalid hash');
  }
  // Safe to use as Hash
  doSomething(input);
}

// Good: Validate hex strings
function parseHash(hex: string): Hash {
  if (!Hash.isValidHex(hex)) {
    throw new Error('Invalid hash hex format');
  }
  return Hash.fromHex(hex);
}

// Bad: Assuming valid input
function unsafeProcess(hash: any): void {
  Hash.toHex.call(hash); // May crash on invalid input
}
```

### Keccak-256 vs SHA-256

Ethereum uses Keccak-256, not standard SHA-256:

```typescript
// Good: Use Hash.keccak256 for Ethereum
const ethHash = Hash.keccak256(data);

// Bad: Using SHA-256 for Ethereum hashing
import { sha256 } from 'some-library';
const wrongHash = sha256(data); // Won't match Ethereum hashes!
```

**Note:** Keccak-256 is the original SHA-3 proposal, slightly different from final NIST SHA-3 standard.

## Best Practices

### 1. Use Type Guards

```typescript
// Good: Check types before operations
if (Hash.isHash(value)) {
  const hex = Hash.toHex.call(value);
}

// Bad: Assuming types
const hex = Hash.toHex.call(value as Hash); // Unsafe
```

### 2. Validate External Data

```typescript
// Good: Validate user input
try {
  const hash = Hash.fromHex(userInput);
  processHash(hash);
} catch (e) {
  showError('Invalid hash format');
}

// Bad: Trusting user input
const hash = Hash.fromHex(userInput); // May throw
```

### 3. Use Constant-Time Comparison

```typescript
// Good: Secure comparison
const valid = Hash.equals.call(actual, expected);

// Bad: Timing-unsafe comparison
const unsafe = Array.from(actual).every((b, i) => b === expected[i]);
```

### 4. Immutable Treatment

```typescript
// Good: Create new hash for modifications
const modified = Hash.clone.call(original);
modified[0] = 0xff;

// Bad: Mutating hash directly
const hash = Hash.fromHex('0x...');
hash[0] = 0xff; // Violates immutability expectations
```

### 5. Clear Error Messages

```typescript
// Good: Descriptive errors
Hash.assert(value, 'Expected transaction hash');

// Bad: Generic errors
Hash.assert(value); // "Value is not a Hash" - not helpful
```

### 6. Prefer Specific Functions

```typescript
// Good: Use specific hashing functions
const stringHash = Hash.keccak256String('hello');
const hexHash = Hash.keccak256Hex('0x1234');

// Bad: Manual encoding
const encoder = new TextEncoder();
const bytes = encoder.encode('hello');
const stringHash2 = Hash.keccak256(bytes); // More verbose
```

## Performance Considerations

### Operation Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| `fromHex` | O(n) | n = 32 bytes |
| `fromBytes` | O(n) | Copy operation |
| `toHex` | O(n) | String conversion |
| `toBytes` | O(n) | Copy operation |
| `equals` | O(n) | Constant-time |
| `isZero` | O(n) | Constant-time |
| `isHash` | O(1) | Type check |
| `isValidHex` | O(n) | String validation |
| `keccak256` | O(m) | m = input size |
| `keccak256String` | O(m) | UTF-8 encode + hash |
| `keccak256Hex` | O(m) | Hex decode + hash |
| `random` | O(n) | CSPRNG |
| `clone` | O(n) | Copy operation |
| `slice` | O(k) | k = slice size |
| `format` | O(n) | String formatting |

### Optimization Tips

1. **Reuse hash instances** - avoid recreating identical hashes
2. **Cache hex conversions** - if hash-to-hex conversion used repeatedly
3. **Batch validation** - validate multiple hashes together when possible
4. **Avoid unnecessary copies** - use toHex/toBytes only when needed

```typescript
// Good: Reuse hash
const hash = Hash.keccak256(data);
const hex1 = Hash.toHex.call(hash);
const hex2 = Hash.toHex.call(hash); // Recomputes - cache if needed

// Good: Cache conversions
const hashCache = new Map<Hash, string>();
function getHex(hash: Hash): string {
  const cached = hashCache.get(hash);
  if (cached) return cached;
  const hex = Hash.toHex.call(hash);
  hashCache.set(hash, hex);
  return hex;
}
```

## Examples

### Complete Hashing Pipeline

```typescript
interface DataItem {
  id: number;
  content: Uint8Array;
}

class HashRegistry {
  private registry = new Map<string, DataItem>();

  register(item: DataItem): Hash {
    // Hash the content
    const hash = Hash.keccak256(item.content);

    // Store with hash as key
    const key = Hash.toHex.call(hash);
    this.registry.set(key, item);

    console.log(`Registered item ${item.id}: ${Hash.format.call(hash)}`);
    return hash;
  }

  verify(item: DataItem, expectedHash: Hash): boolean {
    const actualHash = Hash.keccak256(item.content);
    return Hash.equals.call(actualHash, expectedHash);
  }

  lookup(hash: Hash): DataItem | undefined {
    const key = Hash.toHex.call(hash);
    return this.registry.get(key);
  }
}

// Usage
const registry = new HashRegistry();
const item = { id: 1, content: new Uint8Array([1, 2, 3]) };
const hash = registry.register(item);

if (registry.verify(item, hash)) {
  console.log('Verification passed');
}

const retrieved = registry.lookup(hash);
```

## References

- [Keccak-256 (SHA-3)](https://keccak.team/keccak.html)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [Timing Attacks on Implementations](https://crypto.stanford.edu/~dabo/papers/ssl-timing.pdf)

## API Summary

### Constants
- `SIZE` - Hash size in bytes (32)
- `ZERO` - Zero hash constant
- `hashSymbol` - Type brand symbol

### Creation
- `fromHex(hex)` - Create from hex string
- `fromBytes(bytes)` - Create from raw bytes
- `from(value)` - Create from string (alias)

### Conversion
- `toHex.call(hash)` - Convert to hex string
- `toBytes.call(hash)` - Convert to raw bytes
- `toString.call(hash)` - Convert to string (alias)

### Comparison
- `equals.call(hash1, hash2)` - Constant-time equality check
- `isZero.call(hash)` - Check if zero hash

### Validation
- `isHash(value)` - Type guard for Hash
- `isValidHex(hex)` - Validate hex format
- `assert(value, message?)` - Assert is Hash

### Hashing
- `keccak256(data)` - Hash bytes with Keccak-256
- `keccak256String(str)` - Hash string with Keccak-256
- `keccak256Hex(hex)` - Hash hex string with Keccak-256

### Utilities
- `random()` - Generate random hash
- `clone.call(hash)` - Clone hash
- `slice.call(hash, start?, end?)` - Get byte slice
- `format.call(hash, prefix?, suffix?)` - Format for display
