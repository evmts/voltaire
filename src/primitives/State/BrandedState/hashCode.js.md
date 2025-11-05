# hashCode.js

Compute hash code for storage key for use in hash-based collections.

## Signature

```typescript
function hashCode(key: StorageKeyLike): number
```

## Parameters

- `key` - Storage key to hash

## Returns

`number` - 32-bit signed integer hash code

## Properties

- **Deterministic:** Same key always produces same hash
- **Distributed:** Different keys usually produce different hashes
- **Fast:** O(1) computation
- **Collisions possible:** Different keys may have same hash

## Algorithm

Combines:
1. Address bytes using rolling hash
2. Slot low 32 bits
3. Slot high 32 bits

Formula: `hash = ((hash << 5) - hash + byte) | 0`

## Example

```typescript
const key = { address: addr, slot: 42n };
const hash = StorageKey.hashCode(key);

// Deterministic
const hash2 = StorageKey.hashCode(key);
hash === hash2; // true

// Different keys (usually) different hashes
const key2 = { address: addr, slot: 43n };
const hash3 = StorageKey.hashCode(key2);
hash !== hash3; // usually true (collisions possible)
```

## Use Cases

**Custom Hash Tables:**
```typescript
class HashTable {
  buckets = Array(1024).fill(null).map(() => []);

  set(key, value) {
    const hash = StorageKey.hashCode(key);
    const bucket = Math.abs(hash) % this.buckets.length;
    this.buckets[bucket].push({ key, value });
  }
}
```

**Hash-Based Caching:**
```typescript
const cache = new Map();
const hash = StorageKey.hashCode(key);
cache.set(hash, value);
```

## Note

For Map keys, prefer `toString()` over `hashCode()`. JavaScript Map handles object equality, but string keys are simpler and collision-free.

```typescript
// Preferred: String keys
const map = new Map<string, bigint>();
map.set(StorageKey.toString(key), value);

// Only use hashCode for specialized hash tables
const hashMap = new Map<number, StorageKey[]>();
const hash = StorageKey.hashCode(key);
```

## See Also

- [toString](./toString.js.md) - String conversion for Map keys
- [equals](./equals.js.md) - Equality comparison
