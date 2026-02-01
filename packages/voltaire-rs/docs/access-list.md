# Access List

EIP-2930 access list for specifying storage slots accessed during transaction execution.

## AccessListEntry

Single entry mapping an address to its accessed storage keys.

```rust
use voltaire::primitives::{AccessListEntry, Address, Hash};

// Entry with storage keys
let entry = AccessListEntry::new(
    "0xdead...".parse()?,
    vec![Hash::ZERO, "0x0001...".parse()?],
);

// Address only (no storage keys)
let entry = AccessListEntry::address_only("0xdead...".parse()?);

// Query
assert!(entry.has_storage_keys());
assert!(entry.contains_key(&Hash::ZERO));
# Ok::<(), voltaire::Error>(())
```

## AccessList

Collection of access list entries for a transaction.

```rust
use voltaire::primitives::{AccessList, AccessListEntry, Address, Hash};

// Create empty
let mut list = AccessList::empty();

// Add entries
list.push_address("0xdead...".parse()?);
list.push_entry(
    "0xbeef...".parse()?,
    vec![Hash::ZERO],
);

// Query
assert!(!list.is_empty());
assert!(list.contains_address(&"0xdead...".parse()?));
assert_eq!(list.total_storage_keys(), 1);

// Gas cost (EIP-2930: 2400/addr + 1900/key)
let gas = list.gas_cost();

// Iterate
for entry in &list {
    println!("{}: {} keys", entry.address, entry.storage_keys.len());
}
# Ok::<(), voltaire::Error>(())
```

## Merge & Dedupe

```rust
use voltaire::primitives::{AccessList, AccessListEntry, Address, Hash};

let mut list1 = AccessList::new(vec![
    AccessListEntry::new("0xdead...".parse()?, vec![Hash::ZERO]),
]);

let list2 = AccessList::new(vec![
    AccessListEntry::new("0xdead...".parse()?, vec!["0x0001...".parse()?]),
]);

// Merge combines entries for same address
list1.merge(list2);

// Remove duplicate storage keys
list1.deduplicate();
# Ok::<(), voltaire::Error>(())
```

## Validation

```rust
use voltaire::primitives::AccessList;

let list = AccessList::empty();

// Validates size limits (DoS protection)
list.validate()?;
# Ok::<(), voltaire::Error>(())
```

## Gas Calculation

Per EIP-2930:
- 2400 gas per address
- 1900 gas per storage key

```rust
use voltaire::primitives::{AccessList, AccessListEntry, Address, Hash};

let list = AccessList::new(vec![
    AccessListEntry::new("0xdead...".parse()?, vec![Hash::ZERO, Hash::ZERO]),
]);

// 2400 (addr) + 1900*2 (keys) = 6200
assert_eq!(list.gas_cost(), 6200);
# Ok::<(), voltaire::Error>(())
```
