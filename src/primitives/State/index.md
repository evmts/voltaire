# State

Ethereum state primitives - storage keys and well-known constants for EVM state management.

## Overview

State module provides fundamental primitives for EVM world state:

**Core Components:**
- `StorageKey` - Composite key for contract storage locations
- `EMPTY_CODE_HASH` - Hash of empty bytecode (Keccak256 of "")
- `EMPTY_TRIE_ROOT` - Root hash of empty Merkle Patricia Trie

**Use Cases:**
- Account state validation
- Storage slot addressing
- State trie operations
- Contract code verification

## Factory

```typescript
StorageKey(address: BrandedAddress, slot: bigint): BrandedStorageKey
```

Creates StorageKey instance from address and slot.

**Parameters:**
- `address` - 20-byte contract address
- `slot` - 256-bit storage slot number

**Returns:** BrandedStorageKey instance

## Static Constructors

### [StorageKey.from(value)](./BrandedState/from.js.md)
Loose constructor accepting StorageKeyLike objects.

```typescript
from(value: StorageKeyLike): BrandedStorageKey
```

### [StorageKey.create(address, slot)](./BrandedState/create.js.md)
```typescript
create(address: BrandedAddress, slot: bigint): BrandedStorageKey
```
Creates StorageKey from address and slot.

## Static Utilities

### [StorageKey.toString(key)](./BrandedState/toString.js.md)
```typescript
toString(key: BrandedStorageKey): string
```
Returns string representation: `{address_hex}_{slot_hex}` for use as Map key.

### [StorageKey.fromString(str)](./BrandedState/fromString.js.md)
```typescript
fromString(str: string): BrandedStorageKey | undefined
```
Parses StorageKey from string representation.

### [StorageKey.equals(a, b)](./BrandedState/equals.js.md)
```typescript
equals(a: BrandedStorageKey, b: BrandedStorageKey): boolean
```
Checks equality between two storage keys.

### [StorageKey.hashCode(key)](./BrandedState/hashCode.js.md)
```typescript
hashCode(key: BrandedStorageKey): number
```
Computes hash code for use in hash-based collections.

### [StorageKey.is(value)](./BrandedState/is.js.md)
```typescript
is(value: unknown): value is BrandedStorageKey
```
Type guard checking if value is BrandedStorageKey.

## Constants

### [EMPTY_CODE_HASH](./BrandedState/constants.js.md#empty_code_hash)
```typescript
const EMPTY_CODE_HASH: BrandedHash
```
Value: `0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470`

Hash of empty EVM bytecode. Identifies accounts with no contract code.

### [EMPTY_TRIE_ROOT](./BrandedState/constants.js.md#empty_trie_root)
```typescript
const EMPTY_TRIE_ROOT: BrandedHash
```
Value: `0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421`

Root hash of empty Merkle Patricia Trie. Initial value for storage roots.

## Implementation

- Composite key combining address (20 bytes) and slot (256-bit bigint)
- String conversion for Map keys
- Constant-time equality comparison
- Well-known hash constants for state validation

## Example

```javascript
import { StorageKey, EMPTY_CODE_HASH, EMPTY_TRIE_ROOT } from './State.js';

// Create storage key
const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2');
const key = StorageKey.create(addr, 0n);

// Use as Map key
const storage = new Map();
storage.set(StorageKey.toString(key), 1000n);

// Retrieve
const value = storage.get(StorageKey.toString(key)); // 1000n

// Check account state
function hasCode(codeHash) {
  return !equals(codeHash, EMPTY_CODE_HASH);
}

function hasStorage(storageRoot) {
  return !equals(storageRoot, EMPTY_TRIE_ROOT);
}

// Parse from string
const keyStr = StorageKey.toString(key);
const parsed = StorageKey.fromString(keyStr);
StorageKey.equals(key, parsed); // true
```

## Common Patterns

### Storage Map Management

```javascript
const storage = new Map();

function getStorage(address, slot) {
  const key = StorageKey.create(address, slot);
  return storage.get(StorageKey.toString(key)) ?? 0n;
}

function setStorage(address, slot, value) {
  const key = StorageKey.create(address, slot);
  if (value === 0n) {
    storage.delete(StorageKey.toString(key)); // Clear zero values
  } else {
    storage.set(StorageKey.toString(key), value);
  }
}
```

### Account State Validation

```javascript
function isEmptyAccount(account) {
  return (
    account.nonce === 0n &&
    account.balance === 0n &&
    equals(account.codeHash, EMPTY_CODE_HASH) &&
    equals(account.storageRoot, EMPTY_TRIE_ROOT)
  );
}

function isContract(account) {
  return !equals(account.codeHash, EMPTY_CODE_HASH);
}
```
