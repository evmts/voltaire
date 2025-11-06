---
title: "AccessList.js"
---

# AccessList.js

Factory function creating EIP-2930 access list instances for gas-optimized transactions.

## Factory

```typescript
AccessList(value: readonly Item[] | Uint8Array): BrandedAccessList
```

Creates AccessList instance from array of items or RLP bytes.

**Parameters:**
- `value`: readonly Item[] or Uint8Array (RLP-encoded)

**Returns:** BrandedAccessList instance

## Static Constructors

### [AccessList.from(value)](./BrandedAccessList/from.js.md)
Loose constructor accepting items array or bytes. Same as factory.

### [AccessList.fromBytes(value)](./BrandedAccessList/fromBytes.js.md)
```typescript
fromBytes(value: Uint8Array): BrandedAccessList
```
Decodes RLP bytes to AccessList.

**Throws:** Error if invalid RLP structure

### [AccessList.create()](./BrandedAccessList/create.js.md)
```typescript
create(): BrandedAccessList
```
Returns empty access list.

## Type Guards

### [AccessList.is(value)](./BrandedAccessList/is.js.md)
```typescript
is(value: unknown): value is BrandedAccessList
```
Type guard checking if value is valid AccessList.

### [AccessList.isItem(value)](./BrandedAccessList/isItem.js.md)
```typescript
isItem(value: unknown): value is Item
```
Type guard checking if value is valid AccessList.Item.

## Validation

### [AccessList.assertValid(list)](./BrandedAccessList/assertValid.js.md)
```typescript
assertValid(list: unknown): asserts list is BrandedAccessList
```
Validates access list structure.

**Throws:** Error if invalid structure, addresses, or storage keys

## Query Operations

### [AccessList.includesAddress(list, address)](./BrandedAccessList/includesAddress.js.md)
```typescript
includesAddress(list: BrandedAccessList, address: BrandedAddress): boolean
```
Checks if address exists in access list.

### [AccessList.includesStorageKey(list, address, key)](./BrandedAccessList/includesStorageKey.js.md)
```typescript
includesStorageKey(list: BrandedAccessList, address: BrandedAddress, key: BrandedHash): boolean
```
Checks if storage key exists for address in access list.

### [AccessList.keysFor(list, address)](./BrandedAccessList/keysFor.js.md)
```typescript
keysFor(list: BrandedAccessList, address: BrandedAddress): readonly BrandedHash[] | undefined
```
Returns all storage keys for address, or undefined if address not in list.

### [AccessList.addressCount(list)](./BrandedAccessList/addressCount.js.md)
```typescript
addressCount(list: BrandedAccessList): number
```
Returns total number of addresses in list.

### [AccessList.storageKeyCount(list)](./BrandedAccessList/storageKeyCount.js.md)
```typescript
storageKeyCount(list: BrandedAccessList): number
```
Returns total number of storage keys across all addresses.

### [AccessList.isEmpty(list)](./BrandedAccessList/isEmpty.js.md)
```typescript
isEmpty(list: BrandedAccessList): boolean
```
Checks if access list is empty.

## Manipulation Operations

### [AccessList.deduplicate(list)](./BrandedAccessList/deduplicate.js.md)
```typescript
deduplicate(list: BrandedAccessList): BrandedAccessList
```
Returns new list with duplicate addresses and storage keys removed.

### [AccessList.withAddress(list, address)](./BrandedAccessList/withAddress.js.md)
```typescript
withAddress(list: BrandedAccessList, address: BrandedAddress): BrandedAccessList
```
Returns new list with address added (if not already present).

### [AccessList.withStorageKey(list, address, key)](./BrandedAccessList/withStorageKey.js.md)
```typescript
withStorageKey(list: BrandedAccessList, address: BrandedAddress, key: BrandedHash): BrandedAccessList
```
Returns new list with storage key added for address (adds address if needed).

### [AccessList.merge(...lists)](./BrandedAccessList/merge.js.md)
```typescript
merge(...lists: readonly BrandedAccessList[]): BrandedAccessList
```
Combines multiple access lists with automatic deduplication.

## Gas Optimization

### [AccessList.gasCost(list)](./BrandedAccessList/gasCost.js.md)
```typescript
gasCost(list: BrandedAccessList): bigint
```
Calculates total gas cost for including access list in transaction.

### [AccessList.gasSavings(list)](./BrandedAccessList/gasSavings.js.md)
```typescript
gasSavings(list: BrandedAccessList): bigint
```
Calculates potential gas savings from warm vs cold access.

### [AccessList.hasSavings(list)](./BrandedAccessList/hasSavings.js.md)
```typescript
hasSavings(list: BrandedAccessList): boolean
```
Checks if access list provides net gas savings (savings > cost).

## Conversions

### [AccessList.toBytes(list)](./BrandedAccessList/toBytes.js.md)
```typescript
toBytes(list: BrandedAccessList): Uint8Array
```
Encodes access list to RLP bytes.

## Instance Methods

All static utilities available as instance methods:

```javascript
const list = AccessList.create();
const newList = list.withAddress(addr);
const withKey = newList.withStorageKey(addr, key);
const cost = withKey.gasCost();
const savings = withKey.gasSavings();
withKey.hasSavings()        // boolean
withKey.includesAddress(addr) // boolean
withKey.keysFor(addr)       // BrandedHash[] | undefined
withKey.deduplicate()       // BrandedAccessList
withKey.addressCount()      // number
withKey.storageKeyCount()   // number
withKey.isEmpty()           // boolean
```

Instance methods delegate to BrandedAccessList namespace functions.

## Constants

```typescript
AccessList.ADDRESS_COST = 2400n                 // Per address (EIP-2930)
AccessList.STORAGE_KEY_COST = 1900n            // Per storage key (EIP-2930)
AccessList.COLD_ACCOUNT_ACCESS_COST = 2600n    // Cold account access
AccessList.COLD_STORAGE_ACCESS_COST = 2100n    // Cold storage access
AccessList.WARM_STORAGE_ACCESS_COST = 100n     // Warm access
```

See [constants.js.md](./BrandedAccessList/constants.js.md)

## Implementation

- Array of Item objects
- Item: { address: BrandedAddress, storageKeys: readonly BrandedHash[] }
- Delegates to BrandedAccessList namespace
- Instance methods return AccessList-prototype objects

## Example

```javascript
import { AccessList } from './AccessList.js';
import { Address } from '../Address/Address.js';
import { Hash } from '../Hash/Hash.js';

// Create empty list
let list = AccessList.create();

// Build incrementally
list = list.withAddress(Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2'));
list = list.withStorageKey(
  Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2'),
  Hash.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001')
);

// Calculate gas impact
const cost = list.gasCost();        // 4300n
const savings = list.gasSavings();  // 400n
const beneficial = list.hasSavings(); // false (cost > savings)

// Query
if (list.includesAddress(addr)) {
  const keys = list.keysFor(addr);
  console.log(`Found ${keys.length} keys`);
}

// Merge lists
const combined = AccessList.merge(list1, list2, list3);
const optimized = combined.deduplicate();
```
