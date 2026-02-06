# Transaction

Ethereum transaction types with support for all EIP transaction formats.

## TransactionType

Enum representing the transaction envelope type.

```rust
use voltaire::primitives::TransactionType;

// Detect type from raw bytes
let tx_type = TransactionType::detect(&raw_bytes);

// Match on type
match tx_type {
    TransactionType::Legacy => println!("Legacy (type 0)"),
    TransactionType::Eip2930 => println!("EIP-2930 (type 1)"),
    TransactionType::Eip1559 => println!("EIP-1559 (type 2)"),
    TransactionType::Eip4844 => println!("EIP-4844 (type 3)"),
    TransactionType::Eip7702 => println!("EIP-7702 (type 4)"),
}

// Convert to/from u8
let type_byte: u8 = TransactionType::Eip1559.into();
let tx_type = TransactionType::try_from(0x02)?;

// Type predicates
assert!(TransactionType::Eip1559.is_eip1559());
assert!(TransactionType::Eip2930.supports_access_list());
assert!(TransactionType::Eip1559.is_typed());
```

## Transaction Types

### Legacy (Type 0)

Original Ethereum transaction format with fixed gas price.

```rust
use voltaire::primitives::LegacyTransaction;

let tx = LegacyTransaction {
    nonce: 42,
    gas_price: U256::from(20_000_000_000u64), // 20 gwei
    gas_limit: 21_000,
    to: Some(recipient),
    value: U256::from(1_000_000_000_000_000_000u128), // 1 ETH
    data: vec![],
    v: 37, // EIP-155 mainnet
    r: [0u8; 32],
    s: [0u8; 32],
};

// Extract chain ID from EIP-155 v value
assert_eq!(tx.chain_id(), Some(1)); // mainnet
```

### EIP-2930 (Type 1)

Access list transaction for gas optimization.

```rust
use voltaire::primitives::{Eip2930Transaction, AccessList, AccessListEntry};

let mut access_list = AccessList::empty();
access_list.push(AccessListEntry::new(contract, vec![slot0, slot1]));

let tx = Eip2930Transaction {
    chain_id: 1,
    nonce: 42,
    gas_price: U256::from(20_000_000_000u64),
    gas_limit: 100_000,
    to: Some(contract),
    value: U256::ZERO,
    data: calldata,
    access_list,
    y_parity: 0,
    r: [0u8; 32],
    s: [0u8; 32],
};
```

### EIP-1559 (Type 2)

Dynamic fee transaction with priority fee.

```rust
use voltaire::primitives::Eip1559Transaction;

let tx = Eip1559Transaction {
    chain_id: 1,
    nonce: 42,
    max_priority_fee_per_gas: U256::from(2_000_000_000u64), // 2 gwei tip
    max_fee_per_gas: U256::from(50_000_000_000u64),         // 50 gwei max
    gas_limit: 21_000,
    to: Some(recipient),
    value: U256::from(1_000_000_000_000_000_000u128),
    data: vec![],
    access_list: AccessList::empty(),
    y_parity: 0,
    r: [0u8; 32],
    s: [0u8; 32],
};

// Calculate effective gas price given current base fee
let base_fee = U256::from(10_000_000_000u64);
let effective = tx.effective_gas_price(&base_fee); // 12 gwei
```

### EIP-4844 (Type 3)

Blob transaction for L2 data availability.

```rust
use voltaire::primitives::Eip4844Transaction;

let tx = Eip4844Transaction {
    chain_id: 1,
    nonce: 42,
    max_priority_fee_per_gas: U256::from(2_000_000_000u64),
    max_fee_per_gas: U256::from(50_000_000_000u64),
    gas_limit: 100_000,
    to: blob_consumer, // Must be non-null for blob transactions
    value: U256::ZERO,
    data: vec![],
    access_list: AccessList::empty(),
    max_fee_per_blob_gas: U256::from(1_000_000_000u64),
    blob_versioned_hashes: vec![hash1, hash2],
    y_parity: 0,
    r: [0u8; 32],
    s: [0u8; 32],
};

// Blob transactions cannot be contract creation
assert!(!tx.is_contract_creation());
assert_eq!(tx.blob_count(), 2);
```

### EIP-7702 (Type 4)

EOA code delegation transaction.

```rust
use voltaire::primitives::{Eip7702Transaction, SignedAuthorization, Authorization};

let tx = Eip7702Transaction {
    chain_id: 1,
    nonce: 42,
    max_priority_fee_per_gas: U256::from(2_000_000_000u64),
    max_fee_per_gas: U256::from(50_000_000_000u64),
    gas_limit: 100_000,
    to: Some(contract),
    value: U256::ZERO,
    data: calldata,
    access_list: AccessList::empty(),
    authorization_list: vec![
        SignedAuthorization::new(
            Authorization::new(1, delegate_code, 0),
            0,          // y_parity
            [0u8; 32],  // r
            [0u8; 32],  // s
        ),
    ],
    y_parity: 0,
    r: [0u8; 32],
    s: [0u8; 32],
};

assert_eq!(tx.authorization_count(), 1);
```

## AccessList

Access list for pre-warming storage slots (uses existing AccessList type).

```rust
use voltaire::primitives::{AccessList, AccessListEntry, Address, Hash};

let mut list = AccessList::empty();

// Add address with storage keys
list.push(AccessListEntry::new(
    contract_address,
    vec![Hash::ZERO, Hash::new([1u8; 32])],
));

// Add address only (no storage keys)
list.push(AccessListEntry::address_only(another_contract));

// Calculate gas cost
let gas = list.gas_cost(); // 2400 per address + 1900 per key
```

## Unified Transaction Enum

```rust
use voltaire::primitives::{Transaction, TransactionType};

// Wrap any transaction type
let tx = Transaction::Legacy(legacy_tx);
let tx = Transaction::Eip1559(eip1559_tx);
let tx: Transaction = legacy_tx.into();

// Get common fields
let nonce = tx.nonce();
let gas_limit = tx.gas_limit();
let to: Option<Address> = tx.to();
let value = tx.value();
let data: &[u8] = tx.data();
let tx_type = tx.tx_type();

// Type checks
assert!(tx.is_contract_creation());
assert!(tx.is_signed());
assert!(tx.has_access_list());

// Chain ID (None for pre-EIP-155 legacy)
let chain_id: Option<u64> = tx.chain_id();

// Access list (None for legacy)
if let Some(access_list) = tx.access_list() {
    println!("Has {} entries", access_list.len());
}
```
