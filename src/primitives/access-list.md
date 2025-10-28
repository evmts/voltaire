# AccessList

EIP-2930 access list implementation for gas-optimized Ethereum transactions.

## Overview

Access lists (introduced in [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930)) allow transactions to pre-declare which addresses and storage keys they will access. This reduces gas costs by converting expensive "cold" storage accesses into cheaper "warm" accesses.

**Key Benefits:**
- Reduces gas costs for transactions that access storage
- Makes transaction costs more predictable
- Required for some cross-contract interactions

**When to Use:**
- Transactions accessing multiple contracts or storage slots
- Complex DeFi operations (swaps, liquidity provision)
- Contract deployments that initialize storage
- Cross-contract calls that read state

## Quick Start

```typescript
import { AccessList } from '@tevm/voltaire';
import type { Address, Hash } from '@tevm/voltaire';

// Create addresses and storage keys
const tokenAddress = new Uint8Array(20).fill(1) as Address;
const storageKey = new Uint8Array(32).fill(10) as Hash;

// Build access list
const list: AccessList = [
  {
    address: tokenAddress,
    storageKeys: [storageKey]
  }
];

// Calculate gas impact
const cost = AccessList.gasCost.call(list);
const savings = AccessList.gasSavings.call(list);

if (AccessList.hasSavings.call(list)) {
  console.log(`Net savings: ${savings - cost} gas`);
}
```

## Gas Economics

### Gas Costs (EIP-2930)

```typescript
AccessList.ADDRESS_COST = 2400n;              // Per address
AccessList.STORAGE_KEY_COST = 1900n;          // Per storage key
AccessList.COLD_ACCOUNT_ACCESS_COST = 2600n;  // Without access list
AccessList.COLD_STORAGE_ACCESS_COST = 2100n;  // Without access list
AccessList.WARM_STORAGE_ACCESS_COST = 100n;   // With access list
```

### Calculating Savings

```typescript
const list: AccessList = [
  { address: token, storageKeys: [balanceSlot, allowanceSlot] }
];

// Upfront cost to include in access list
const cost = AccessList.gasCost.call(list);
// cost = 2400 + (1900 × 2) = 6200 gas

// Savings from warm vs cold access
const savings = AccessList.gasSavings.call(list);
// savings = (2600 - 2400) + (2100 - 1900) × 2 = 600 gas

// Net result
if (AccessList.hasSavings.call(list)) {
  // Only beneficial if you access those slots
}
```

**Rule of Thumb:** Access lists save gas when you access the same storage slots they declare.

## Core Types

### AccessList

The main type representing an array of access list items.

```typescript
type AccessList = readonly AccessList.Item[];
```

### AccessList.Item

Single entry containing an address and its storage keys.

```typescript
type Item = {
  address: Address;              // 20-byte contract address
  storageKeys: readonly Hash[];  // 32-byte storage keys
};
```

## Type Guards

### isItem

Check if value is a valid AccessList.Item.

```typescript
AccessList.isItem(value: unknown): value is AccessList.Item
```

```typescript
const item = { address: addr, storageKeys: [key] };

if (AccessList.isItem(item)) {
  // TypeScript knows this is AccessList.Item
  console.log(item.address.length); // 20
}
```

### is

Check if value is a valid AccessList.

```typescript
AccessList.is(value: unknown): value is AccessList
```

```typescript
const list = [{ address: addr, storageKeys: [] }];

if (AccessList.is(list)) {
  // Safe to use as AccessList
  const cost = AccessList.gasCost.call(list);
}
```

## Gas Operations

### gasCost

Calculate total gas cost for including access list in transaction.

```typescript
AccessList.gasCost.call(list: AccessList): bigint
```

```typescript
const list: AccessList = [
  { address: addr1, storageKeys: [key1, key2] },
  { address: addr2, storageKeys: [] }
];

const cost = AccessList.gasCost.call(list);
// cost = (2400 × 2) + (1900 × 2) = 8600 gas
```

### gasSavings

Calculate potential gas savings from using access list.

```typescript
AccessList.gasSavings.call(list: AccessList): bigint
```

```typescript
const savings = AccessList.gasSavings.call(list);

// Compares cold vs warm access costs
// Only realized if transaction actually accesses those slots
```

### hasSavings

Check if access list provides net gas savings.

```typescript
AccessList.hasSavings.call(list: AccessList): boolean
```

```typescript
if (AccessList.hasSavings.call(list)) {
  // Include access list in transaction
  transaction.accessList = list;
} else {
  // Skip access list
  transaction.accessList = [];
}
```

## Query Operations

### includesAddress

Check if address exists in access list.

```typescript
AccessList.includesAddress.call(list: AccessList, address: Address): boolean
```

```typescript
const hasToken = AccessList.includesAddress.call(list, tokenAddress);
if (!hasToken) {
  list = AccessList.withAddress.call(list, tokenAddress);
}
```

### includesStorageKey

Check if storage key is accessible for address.

```typescript
AccessList.includesStorageKey.call(
  list: AccessList,
  address: Address,
  storageKey: Hash
): boolean
```

```typescript
const isAccessible = AccessList.includesStorageKey.call(
  list,
  tokenAddress,
  balanceSlot
);
```

### keysFor

Get all storage keys for an address.

```typescript
AccessList.keysFor.call(list: AccessList, address: Address): readonly Hash[] | undefined
```

```typescript
const keys = AccessList.keysFor.call(list, tokenAddress);
if (keys) {
  console.log(`Found ${keys.length} storage keys`);
}
```

## Transformation Operations

All transformation operations return new instances (immutable).

### deduplicate

Remove duplicate addresses and storage keys.

```typescript
AccessList.deduplicate.call(list: AccessList): AccessList
```

```typescript
const list: AccessList = [
  { address: token, storageKeys: [key1] },
  { address: token, storageKeys: [key2, key1] },  // Duplicate address and key
];

const deduped = AccessList.deduplicate.call(list);
// Result: [{ address: token, storageKeys: [key1, key2] }]
```

### withAddress

Add address to access list (if not present).

```typescript
AccessList.withAddress.call(list: AccessList, address: Address): AccessList
```

```typescript
let list = AccessList.create();
list = AccessList.withAddress.call(list, tokenAddress);
list = AccessList.withAddress.call(list, routerAddress);
```

### withStorageKey

Add storage key for address (adds address if needed).

```typescript
AccessList.withStorageKey.call(
  list: AccessList,
  address: Address,
  storageKey: Hash
): AccessList
```

```typescript
let list = AccessList.create();
list = AccessList.withStorageKey.call(list, token, balanceSlot);
list = AccessList.withStorageKey.call(list, token, allowanceSlot);
```

### merge

Combine multiple access lists with deduplication.

```typescript
AccessList.merge(...accessLists: AccessList[]): AccessList
```

```typescript
const list1: AccessList = [{ address: token1, storageKeys: [key1] }];
const list2: AccessList = [{ address: token2, storageKeys: [key2] }];
const list3: AccessList = [{ address: token1, storageKeys: [key3] }];

const merged = AccessList.merge(list1, list2, list3);
// Merges all lists and deduplicates
```

## Validation

### assertValid

Validate access list structure (throws on invalid).

```typescript
AccessList.assertValid.call(list: AccessList): void
```

```typescript
try {
  AccessList.assertValid.call(list);
  console.log('Valid access list');
} catch (err) {
  console.error('Invalid:', err.message);
}
```

**Validates:**
- List is an array
- Each item has valid structure
- Addresses are 20 bytes
- Storage keys are 32 bytes

## Utility Operations

### addressCount

Count total addresses in list.

```typescript
AccessList.addressCount.call(list: AccessList): number
```

```typescript
const count = AccessList.addressCount.call(list);
console.log(`Accessing ${count} contracts`);
```

### storageKeyCount

Count total storage keys across all addresses.

```typescript
AccessList.storageKeyCount.call(list: AccessList): number
```

```typescript
const keyCount = AccessList.storageKeyCount.call(list);
console.log(`Accessing ${keyCount} storage slots`);
```

### isEmpty

Check if access list is empty.

```typescript
AccessList.isEmpty.call(list: AccessList): boolean
```

```typescript
if (AccessList.isEmpty.call(list)) {
  console.log('No access list entries');
}
```

### create

Create empty access list.

```typescript
AccessList.create(): AccessList
```

```typescript
let list = AccessList.create();
// Build up list incrementally
```

## Encoding/Decoding

**Status:** Not yet implemented

### toBytes

Encode access list to RLP bytes.

```typescript
AccessList.toBytes.call(list: AccessList): Uint8Array
```

### fromBytes

Decode RLP bytes to access list.

```typescript
AccessList.fromBytes(bytes: Uint8Array): AccessList
```

## Common Patterns

### Building Access Lists Incrementally

```typescript
let list = AccessList.create();

// Add contracts
list = AccessList.withAddress.call(list, routerAddress);
list = AccessList.withAddress.call(list, factoryAddress);

// Add storage keys
list = AccessList.withStorageKey.call(list, token, balanceSlot);
list = AccessList.withStorageKey.call(list, token, allowanceSlot);

// Optimize
list = AccessList.deduplicate.call(list);
```

### Analyzing Gas Impact

```typescript
function analyzeAccessList(list: AccessList) {
  const addresses = AccessList.addressCount.call(list);
  const keys = AccessList.storageKeyCount.call(list);
  const cost = AccessList.gasCost.call(list);
  const savings = AccessList.gasSavings.call(list);
  const netSavings = savings - cost;

  return {
    addresses,
    keys,
    cost,
    savings,
    netSavings,
    beneficial: netSavings > 0n
  };
}

const analysis = analyzeAccessList(myList);
console.log(`Net impact: ${analysis.netSavings} gas`);
```

### Merging Transaction Access Lists

```typescript
function combineAccessLists(...txAccessLists: AccessList[]): AccessList {
  const merged = AccessList.merge(...txAccessLists);
  const deduped = AccessList.deduplicate.call(merged);

  return AccessList.hasSavings.call(deduped) ? deduped : [];
}

const batchList = combineAccessLists(tx1.accessList, tx2.accessList);
```

### Conditional Access List Usage

```typescript
function optimizeTransaction(tx: Transaction): Transaction {
  if (AccessList.isEmpty.call(tx.accessList)) {
    return tx; // No access list to optimize
  }

  const deduped = AccessList.deduplicate.call(tx.accessList);

  if (!AccessList.hasSavings.call(deduped)) {
    // Access list costs more than it saves
    return { ...tx, accessList: [] };
  }

  return { ...tx, accessList: deduped };
}
```

## Best Practices

### 1. Always Deduplicate

```typescript
// Good: Deduplicate before using
const list = AccessList.deduplicate.call(rawList);

// Bad: Using list with duplicates
const cost = AccessList.gasCost.call(rawList); // Overpays
```

### 2. Check Savings Before Using

```typescript
// Good: Only use if beneficial
if (AccessList.hasSavings.call(list)) {
  transaction.accessList = list;
}

// Bad: Always including access list
transaction.accessList = list; // May increase costs
```

### 3. Build Incrementally

```typescript
// Good: Build up gradually
let list = AccessList.create();
for (const contract of contracts) {
  list = AccessList.withAddress.call(list, contract.address);
}

// Bad: Manual array manipulation
const list = [];
list.push({ address: addr1, storageKeys: [] }); // No type safety
```

### 4. Validate External Data

```typescript
// Good: Validate untrusted access lists
try {
  AccessList.assertValid.call(userProvidedList);
  processAccessList(userProvidedList);
} catch (err) {
  throw new Error('Invalid access list from user');
}

// Bad: Trusting external data
processAccessList(userProvidedList); // May crash
```

### 5. Use Type Guards

```typescript
// Good: Verify before using
if (AccessList.is(maybeList)) {
  const cost = AccessList.gasCost.call(maybeList);
}

// Bad: Assuming types
const cost = AccessList.gasCost.call(maybeList as AccessList); // Unsafe
```

## Performance Considerations

### Operation Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| `gasCost` | O(n) | n = total items |
| `gasSavings` | O(n) | n = total items |
| `includesAddress` | O(n) | n = addresses |
| `includesStorageKey` | O(n×m) | n = addresses, m = avg keys |
| `deduplicate` | O(n²×m) | Byte-by-byte comparison |
| `withAddress` | O(n) | Must check existence |
| `withStorageKey` | O(n×m) | Must check key existence |
| `merge` | O(k×n²×m) | k = lists to merge |

### Optimization Tips

1. **Deduplicate once at the end** rather than after every addition
2. **Use `includesAddress` before `withAddress`** to avoid unnecessary copies
3. **Keep lists small** - large access lists may not be beneficial
4. **Cache gas calculations** if analyzing same list multiple times

## Examples

### DeFi Swap Transaction

```typescript
const routerAddress = getAddress('0x...');
const token0Address = getAddress('0x...');
const token1Address = getAddress('0x...');

let list = AccessList.create();

// Router contract
list = AccessList.withAddress.call(list, routerAddress);

// Token0 balance and allowance
list = AccessList.withStorageKey.call(list, token0Address, balanceSlot);
list = AccessList.withStorageKey.call(list, token0Address, allowanceSlot);

// Token1 balance
list = AccessList.withStorageKey.call(list, token1Address, balanceSlot);

const analysis = {
  cost: AccessList.gasCost.call(list),
  savings: AccessList.gasSavings.call(list),
  beneficial: AccessList.hasSavings.call(list)
};

console.log(`Access list: ${analysis.beneficial ? 'include' : 'skip'}`);
```

### Contract Deployment

```typescript
// Pre-declare storage initialization slots
const storageSlots = [
  ownerSlot,
  totalSupplySlot,
  balanceRootSlot,
  allowanceRootSlot
];

let list = AccessList.create();
list = AccessList.withAddress.call(list, deployedAddress);

for (const slot of storageSlots) {
  list = AccessList.withStorageKey.call(list, deployedAddress, slot);
}

// Deployment transactions benefit most from access lists
console.log(`Deployment gas savings: ${AccessList.gasSavings.call(list)}`);
```

## References

- [EIP-2930: Optional Access Lists](https://eips.ethereum.org/EIPS/eip-2930)
- [EIP-2929: Gas Cost Increases for State Access](https://eips.ethereum.org/EIPS/eip-2929)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)

## API Summary

### Type Guards
- `isItem(value)` - Check if value is AccessList.Item
- `is(value)` - Check if value is AccessList

### Gas Operations
- `gasCost.call(list)` - Calculate inclusion cost
- `gasSavings.call(list)` - Calculate potential savings
- `hasSavings.call(list)` - Check if beneficial

### Query Operations
- `includesAddress.call(list, address)` - Check address presence
- `includesStorageKey.call(list, address, key)` - Check key presence
- `keysFor.call(list, address)` - Get keys for address

### Transformations
- `deduplicate.call(list)` - Remove duplicates
- `withAddress.call(list, address)` - Add address
- `withStorageKey.call(list, address, key)` - Add storage key
- `merge(...lists)` - Combine lists

### Validation
- `assertValid.call(list)` - Validate structure

### Utilities
- `addressCount.call(list)` - Count addresses
- `storageKeyCount.call(list)` - Count storage keys
- `isEmpty.call(list)` - Check if empty
- `create()` - Create empty list

### Encoding/Decoding (Not Implemented)
- `toBytes.call(list)` - Encode to RLP
- `fromBytes(bytes)` - Decode from RLP
