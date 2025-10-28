# State

Ethereum state primitives - storage keys and well-known constants for EVM state management.

## Overview

The State module provides fundamental primitives for working with Ethereum's world state:

**Core Components:**
- `EMPTY_CODE_HASH` - Hash of empty bytecode
- `EMPTY_TRIE_ROOT` - Root of empty Merkle Patricia Trie
- `StorageKey` - Composite key for contract storage locations

**Use Cases:**
- Account state validation
- Storage slot addressing
- State trie operations
- Contract code verification

## Quick Start

```typescript
import { StorageKey, EMPTY_CODE_HASH, EMPTY_TRIE_ROOT } from '@tevm/voltaire';
import type { Address } from '@tevm/voltaire';

// Check if account has code
function hasCode(codeHash: Uint8Array): boolean {
  return !arraysEqual(codeHash, EMPTY_CODE_HASH);
}

// Create storage key
const contractAddr = new Uint8Array(20).fill(1) as Address;
const slot = 0n; // Balance slot

const key: StorageKey = {
  address: contractAddr,
  slot: slot
};

// Use in storage map
const storage = new Map<string, bigint>();
storage.set(StorageKey.toString(key), 1000n);
```

## Constants

### EMPTY_CODE_HASH

Hash of empty EVM bytecode (Keccak256 of empty bytes).

```typescript
const EMPTY_CODE_HASH: Hash
```

**Value:** `0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470`

**Usage:**

```typescript
// Check if account has no code
function isEmptyCode(codeHash: Hash): boolean {
  if (codeHash.length !== 32) return false;
  for (let i = 0; i < 32; i++) {
    if (codeHash[i] !== EMPTY_CODE_HASH[i]) return false;
  }
  return true;
}

// Verify new account
const account = {
  nonce: 0n,
  balance: 0n,
  codeHash: EMPTY_CODE_HASH,  // No code
  storageRoot: EMPTY_TRIE_ROOT // No storage
};
```

### EMPTY_TRIE_ROOT

Root hash of an empty Merkle Patricia Trie.

```typescript
const EMPTY_TRIE_ROOT: Hash
```

**Value:** `0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421`

This is Keccak256(RLP(null)) where RLP(null) = 0x80.

**Usage:**

```typescript
// Check if account has no storage
function hasStorage(storageRoot: Hash): boolean {
  for (let i = 0; i < 32; i++) {
    if (storageRoot[i] !== EMPTY_TRIE_ROOT[i]) return true;
  }
  return false;
}

// Initialize new contract
const newContract = {
  codeHash: deployedCodeHash,
  storageRoot: EMPTY_TRIE_ROOT  // Start with empty storage
};
```

## StorageKey Type

Composite key uniquely identifying a storage location within the EVM.

```typescript
interface StorageKey {
  readonly address: Address;  // 20-byte contract address
  readonly slot: bigint;      // 256-bit storage slot
}
```

**Design:**
- Combines contract address with storage slot number
- Each contract has 2^256 storage slots
- Slots are sparsely allocated (most are zero)

**Example:**

```typescript
// Token balance storage key
const balanceKey: StorageKey = {
  address: tokenAddress,
  slot: 0n  // Slot 0 typically stores total supply
};

// Computed mapping slot
function getMappingSlot(baseSlot: bigint, key: Address): bigint {
  // In Solidity: mapping(address => uint256) at slot N
  // Storage location = keccak256(key . baseSlot)
  // (Simplified - actual computation needs hash)
  return baseSlot;
}
```

## Type Guards

### StorageKey.is

Check if value is a valid StorageKey.

```typescript
StorageKey.is(value: unknown): value is StorageKey
```

**Validates:**
- Value is an object
- Has `address` field (Uint8Array, 20 bytes)
- Has `slot` field (bigint)

```typescript
function processKey(value: unknown) {
  if (StorageKey.is(value)) {
    // TypeScript knows value is StorageKey
    console.log(`Slot: ${value.slot}`);
  }
}

// Examples
StorageKey.is({ address: addr, slot: 0n });  // true
StorageKey.is({ address: addr });            // false - missing slot
StorageKey.is({ slot: 0n });                 // false - missing address
StorageKey.is(null);                         // false
```

## StorageKey Creation

### create

Create a new StorageKey.

```typescript
StorageKey.create(address: Address, slot: bigint): StorageKey
```

```typescript
const key = StorageKey.create(contractAddr, 0n);

// Equivalent to literal
const key2: StorageKey = { address: contractAddr, slot: 0n };

// Multiple slots for same contract
const balanceSlot = StorageKey.create(token, 0n);
const totalSupplySlot = StorageKey.create(token, 1n);
const ownerSlot = StorageKey.create(token, 2n);
```

## Comparison Operations

### equals

Check equality between two storage keys.

```typescript
StorageKey.equals(a: StorageKey, b: StorageKey): boolean
```

Two keys are equal if both address and slot match exactly.

```typescript
const key1: StorageKey = { address: addr, slot: 42n };
const key2: StorageKey = { address: addr, slot: 42n };
const key3: StorageKey = { address: addr, slot: 43n };

StorageKey.equals(key1, key2);  // true - same address and slot
StorageKey.equals(key1, key3);  // false - different slots

// Method form
StorageKey.equals_.call(key1, key2);  // true
```

**Performance:** O(20) - compares all address bytes

## String Conversion

### toString

Convert StorageKey to string for use as Map key.

```typescript
StorageKey.toString(key: StorageKey): string
```

**Format:** `{address_hex}_{slot_hex}`
- Address: 40 hex characters (20 bytes)
- Slot: 64 hex characters (32 bytes)
- Separator: underscore

```typescript
const key: StorageKey = { address: addr, slot: 42n };
const str = StorageKey.toString(key);
// str = "0101...0101_000000...00002a"

// Use as Map key
const storage = new Map<string, bigint>();
storage.set(str, 1000n);

// Method form
const str2 = StorageKey.toString_.call(key);
```

### fromString

Parse StorageKey from its string representation.

```typescript
StorageKey.fromString(str: string): StorageKey | undefined
```

Returns `undefined` if string is invalid.

```typescript
const str = StorageKey.toString(key);
const parsed = StorageKey.fromString(str);

if (parsed) {
  console.log(`Slot: ${parsed.slot}`);
}

// Round-trip conversion
const original: StorageKey = { address: addr, slot: 42n };
const restored = StorageKey.fromString(StorageKey.toString(original));
// restored equals original

// Invalid strings
StorageKey.fromString("invalid");           // undefined
StorageKey.fromString("no_separator");      // undefined
StorageKey.fromString("abc_def");           // undefined - wrong length
```

## Hash Operations

### hashCode

Compute hash code for use in hash-based collections.

```typescript
StorageKey.hashCode(key: StorageKey): number
```

**Properties:**
- Consistent for same key
- Different for different keys (usually)
- Returns JavaScript number (32-bit signed integer)

```typescript
const hash1 = StorageKey.hashCode(key1);
const hash2 = StorageKey.hashCode(key1);
// hash1 === hash2 (deterministic)

const hash3 = StorageKey.hashCode(key2);
// hash1 !== hash3 (usually - hash collisions possible)

// Method form
const hash4 = StorageKey.hashCode_.call(key1);
```

**Note:** For Map keys, use `toString()` instead. Hash codes are for specialized hash tables.

## Common Patterns

### Storage Map Management

```typescript
// Create storage map using string keys
const storage = new Map<string, bigint>();

function getStorage(address: Address, slot: bigint): bigint | undefined {
  const key: StorageKey = { address, slot };
  return storage.get(StorageKey.toString(key));
}

function setStorage(address: Address, slot: bigint, value: bigint): void {
  const key: StorageKey = { address, slot };
  storage.set(StorageKey.toString(key), value);
}

function deleteStorage(address: Address, slot: bigint): boolean {
  const key: StorageKey = { address, slot };
  return storage.delete(StorageKey.toString(key));
}

// Usage
setStorage(token, 0n, 1000000n);  // Total supply
setStorage(token, 1n, ownerAddr); // Owner
const supply = getStorage(token, 0n);
```

### Account State Checking

```typescript
interface Account {
  address: Address;
  nonce: bigint;
  balance: bigint;
  codeHash: Hash;
  storageRoot: Hash;
}

function isEmptyAccount(account: Account): boolean {
  return (
    account.nonce === 0n &&
    account.balance === 0n &&
    arraysEqual(account.codeHash, EMPTY_CODE_HASH) &&
    arraysEqual(account.storageRoot, EMPTY_TRIE_ROOT)
  );
}

function isContract(account: Account): boolean {
  return !arraysEqual(account.codeHash, EMPTY_CODE_HASH);
}

function isEOA(account: Account): boolean {
  return arraysEqual(account.codeHash, EMPTY_CODE_HASH);
}

function hasStorageChanges(account: Account): boolean {
  return !arraysEqual(account.storageRoot, EMPTY_TRIE_ROOT);
}
```

### Storage Slot Calculation

```typescript
// Solidity storage layout helpers
import { Hex } from '@tevm/voltaire';
import { keccak256 } from 'some-hash-library';

function getArraySlot(baseSlot: bigint, index: bigint): bigint {
  // For dynamic arrays: location = keccak256(baseSlot) + index
  const baseHash = keccak256(Hex.fromBigInt(baseSlot, 32));
  const slotNum = Hex.toBigInt(baseHash);
  return slotNum + index;
}

function getMappingSlot(baseSlot: bigint, key: Address): bigint {
  // For mappings: location = keccak256(key . baseSlot)
  const keyBytes = new Uint8Array(52);
  keyBytes.set(key, 0);                    // 20 bytes
  keyBytes.set(Hex.fromBigInt(baseSlot, 32), 20); // 32 bytes
  const hash = keccak256(keyBytes);
  return Hex.toBigInt(hash);
}

// Usage
const balancesSlot = 3n; // Solidity: mapping(address => uint256) balances
const userAddr = getAddress('0x...');
const balanceSlot = getMappingSlot(balancesSlot, userAddr);

const key: StorageKey = {
  address: tokenAddr,
  slot: balanceSlot
};
```

### Batch Storage Operations

```typescript
function loadBatchStorage(
  storage: Map<string, bigint>,
  address: Address,
  slots: bigint[]
): Map<bigint, bigint> {
  const results = new Map<bigint, bigint>();

  for (const slot of slots) {
    const key: StorageKey = { address, slot };
    const value = storage.get(StorageKey.toString(key));
    if (value !== undefined) {
      results.set(slot, value);
    }
  }

  return results;
}

function storeBatchStorage(
  storage: Map<string, bigint>,
  address: Address,
  updates: Map<bigint, bigint>
): void {
  for (const [slot, value] of updates) {
    const key: StorageKey = { address, slot };
    if (value === 0n) {
      // Zero value = delete storage
      storage.delete(StorageKey.toString(key));
    } else {
      storage.set(StorageKey.toString(key), value);
    }
  }
}

// Load multiple slots
const slots = [0n, 1n, 2n];
const values = loadBatchStorage(storage, tokenAddr, slots);

// Store multiple updates
const updates = new Map<bigint, bigint>([
  [0n, 1000000n],
  [1n, 500000n]
]);
storeBatchStorage(storage, tokenAddr, updates);
```

### Storage Diff Tracking

```typescript
interface StorageChange {
  key: StorageKey;
  oldValue: bigint | undefined;
  newValue: bigint;
}

class StorageTracker {
  private storage = new Map<string, bigint>();
  private changes: StorageChange[] = [];

  get(address: Address, slot: bigint): bigint | undefined {
    const key: StorageKey = { address, slot };
    return this.storage.get(StorageKey.toString(key));
  }

  set(address: Address, slot: bigint, value: bigint): void {
    const key: StorageKey = { address, slot };
    const keyStr = StorageKey.toString(key);
    const oldValue = this.storage.get(keyStr);

    if (oldValue !== value) {
      this.changes.push({ key, oldValue, newValue: value });
      this.storage.set(keyStr, value);
    }
  }

  getChanges(): StorageChange[] {
    return [...this.changes];
  }

  clearChanges(): void {
    this.changes = [];
  }
}

const tracker = new StorageTracker();
tracker.set(token, 0n, 1000n);
tracker.set(token, 1n, 500n);
const changes = tracker.getChanges();
console.log(`${changes.length} storage changes`);
```

## Best Practices

### 1. Use String Keys for Maps

```typescript
// Good: String keys for Map
const storage = new Map<string, bigint>();
const keyStr = StorageKey.toString(key);
storage.set(keyStr, value);

// Bad: Object keys won't work correctly
const storage = new Map<StorageKey, bigint>();
storage.set(key, value);  // Object reference equality issues
```

### 2. Validate External StorageKeys

```typescript
// Good: Validate untrusted keys
function processStorageKey(value: unknown) {
  if (!StorageKey.is(value)) {
    throw new Error('Invalid storage key');
  }
  return value;
}

// Bad: Trusting external data
function processStorageKey(value: any) {
  return value as StorageKey;  // Unsafe
}
```

### 3. Use Constants for Comparisons

```typescript
// Good: Direct constant comparison
function isEmptyCode(hash: Hash): boolean {
  return arraysEqual(hash, EMPTY_CODE_HASH);
}

// Bad: Hardcoded values
function isEmptyCode(hash: Hash): boolean {
  return hash[0] === 0xc5 && hash[1] === 0xd2 /* ... */;
}
```

### 4. Cache String Conversions

```typescript
// Good: Cache when used multiple times
const keyStr = StorageKey.toString(key);
storage.set(keyStr, value);
console.log(`Set ${keyStr}`);

// Bad: Converting multiple times
storage.set(StorageKey.toString(key), value);
console.log(`Set ${StorageKey.toString(key)}`);
```

### 5. Handle Zero Storage Values

```typescript
// Good: Delete zero values (EIP-2200)
function setStorage(key: StorageKey, value: bigint) {
  const keyStr = StorageKey.toString(key);
  if (value === 0n) {
    storage.delete(keyStr);  // Clear storage
  } else {
    storage.set(keyStr, value);
  }
}

// Bad: Storing zeros
storage.set(keyStr, 0n);  // Wastes space
```

## Performance Considerations

### Operation Complexity

| Operation | Time | Space | Notes |
|-----------|------|-------|-------|
| `is` | O(1) | O(1) | Fast type check |
| `create` | O(1) | O(1) | Object creation |
| `equals` | O(1) | O(1) | 20 byte comparisons |
| `toString` | O(1) | O(1) | String allocation |
| `fromString` | O(1) | O(1) | Parsing overhead |
| `hashCode` | O(1) | O(1) | Hash computation |

### Memory Usage

- **StorageKey**: ~60 bytes (address + slot + object overhead)
- **String key**: ~150 bytes (104 hex chars + overhead)
- **Constant access**: Near zero (shared reference)

### Optimization Tips

1. **Reuse string keys** - Cache `toString()` results when accessing same key multiple times
2. **Batch operations** - Group storage reads/writes to amortize conversion costs
3. **Avoid unnecessary copies** - StorageKey is immutable, pass by reference
4. **Use constants directly** - Don't copy EMPTY_CODE_HASH or EMPTY_TRIE_ROOT

## Edge Cases

### Maximum Slot Values

```typescript
// Maximum possible slot
const maxSlot = (2n ** 256n) - 1n;
const key: StorageKey = { address: addr, slot: maxSlot };

// Should handle without overflow
const str = StorageKey.toString(key);
const parsed = StorageKey.fromString(str);
// parsed.slot === maxSlot
```

### Zero Values

```typescript
// Zero address and slot
const zeroKey: StorageKey = {
  address: new Uint8Array(20) as Address,
  slot: 0n
};

// Should work correctly
const str = StorageKey.toString(zeroKey);  // Valid string
```

### Identical Addresses

```typescript
// Same address, different slots
const addr = createAddress(1);
const key1: StorageKey = { address: addr, slot: 0n };
const key2: StorageKey = { address: addr, slot: 1n };

// Should be different
StorageKey.equals(key1, key2);  // false
StorageKey.toString(key1) !== StorageKey.toString(key2);  // true
```

## API Summary

### Constants
- `EMPTY_CODE_HASH` - Hash of empty bytecode (32 bytes)
- `EMPTY_TRIE_ROOT` - Empty trie root hash (32 bytes)

### Type Guards
- `StorageKey.is(value)` - Check if valid StorageKey

### Creation
- `StorageKey.create(address, slot)` - Create new key

### Comparison
- `StorageKey.equals(a, b)` - Check equality
- `StorageKey.equals_.call(key, other)` - Method form

### String Conversion
- `StorageKey.toString(key)` - Convert to string
- `StorageKey.toString_.call(key)` - Method form
- `StorageKey.fromString(str)` - Parse from string

### Hashing
- `StorageKey.hashCode(key)` - Compute hash code
- `StorageKey.hashCode_.call(key)` - Method form

## Examples

### Simple Storage Contract

```typescript
class SimpleStorage {
  private storage = new Map<string, bigint>();

  set(address: Address, slot: bigint, value: bigint): void {
    const key = StorageKey.create(address, slot);
    this.storage.set(StorageKey.toString(key), value);
  }

  get(address: Address, slot: bigint): bigint {
    const key = StorageKey.create(address, slot);
    return this.storage.get(StorageKey.toString(key)) ?? 0n;
  }

  has(address: Address, slot: bigint): boolean {
    const key = StorageKey.create(address, slot);
    return this.storage.has(StorageKey.toString(key));
  }
}

const storage = new SimpleStorage();
storage.set(tokenAddr, 0n, 1000000n);
console.log(storage.get(tokenAddr, 0n)); // 1000000n
```

### Account Manager

```typescript
interface AccountState {
  nonce: bigint;
  balance: bigint;
  codeHash: Hash;
  storageRoot: Hash;
}

function createEmptyAccount(): AccountState {
  return {
    nonce: 0n,
    balance: 0n,
    codeHash: EMPTY_CODE_HASH,
    storageRoot: EMPTY_TRIE_ROOT
  };
}

function createContractAccount(codeHash: Hash): AccountState {
  return {
    nonce: 1n, // Contract starts at nonce 1
    balance: 0n,
    codeHash: codeHash,
    storageRoot: EMPTY_TRIE_ROOT
  };
}

function accountType(account: AccountState): 'empty' | 'eoa' | 'contract' {
  const isEmpty =
    account.nonce === 0n &&
    account.balance === 0n &&
    arraysEqual(account.codeHash, EMPTY_CODE_HASH) &&
    arraysEqual(account.storageRoot, EMPTY_TRIE_ROOT);

  if (isEmpty) return 'empty';

  const isEOA = arraysEqual(account.codeHash, EMPTY_CODE_HASH);
  return isEOA ? 'eoa' : 'contract';
}
```

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Section 4 (State)
- [EIP-161: State Trie Clearing](https://eips.ethereum.org/EIPS/eip-161)
- [Merkle Patricia Trie Specification](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/)
- [Ethereum Account Model](https://ethereum.org/en/developers/docs/accounts/)
