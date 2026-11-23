# Access Lists

EIP-2930 access list types (`AccessListEntry` and `AccessList`) in `voltaire::primitives` for pre-warming account addresses and storage slots.

## Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| `MAX_ACCESS_LIST_ENTRIES` | `1_000` | Maximum entries enforced by `AccessList::validate()` |
| `MAX_STORAGE_KEYS_PER_ENTRY` | `10_000` | Maximum storage keys enforced by `AccessListEntry::validate()` |

Gas pricing per EIP-2930: `2400` gas per entry address + `1900` gas per storage key.

## Usage

```rust
use voltaire::primitives::{AccessList, AccessListEntry, Address, Hash};

let contract: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?;
let slot0 = Hash::ZERO;
let slot1 = Hash::new([1u8; 32]);

// Single entry
let entry = AccessListEntry::new(contract, vec![slot0, slot1]);
assert!(entry.has_storage_keys());
assert_eq!(entry.storage_key_count(), 2);
assert!(entry.contains_key(&slot0));
entry.validate()?;

// AccessList collection
let mut list = AccessList::empty();
list.push(entry);
list.push_address("0x0000000000000000000000000000000000000001".parse()?);

assert_eq!(list.len(), 2);
assert_eq!(list.total_storage_keys(), 2);
assert!(list.contains_address(&contract));
assert!(list.contains_storage_key(&contract, &slot1));

// 2 addresses * 2400 + 2 keys * 1900 = 8600 gas
assert_eq!(list.gas_cost(), 8_600);
list.validate()?;
# Ok::<(), voltaire::Error>(())
```

## Merging and Deduplicating

`merge` combines another `AccessList` into `self` by appending keys for matching addresses; `deduplicate` removes duplicate addresses and duplicate storage keys.

```rust
use voltaire::primitives::{AccessList, AccessListEntry, Address, Hash};

let contract: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?;
let mut a = AccessList::new(vec![AccessListEntry::new(contract, vec![Hash::ZERO])]);
let b = AccessList::new(vec![AccessListEntry::new(contract, vec![Hash::ZERO, Hash::new([2u8; 32])])]);

a.merge(b);
a.deduplicate();
assert_eq!(a.len(), 1);
assert_eq!(a.total_storage_keys(), 2);
# Ok::<(), voltaire::Error>(())
```
