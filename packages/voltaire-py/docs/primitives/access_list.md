# AccessList

EIP-2930 access lists for gas-optimized storage access.

## Overview

The `AccessList` and `AccessListEntry` classes represent EIP-2930 access lists, which specify addresses and storage keys that a transaction will access. By declaring these upfront, transactions can benefit from reduced gas costs for "warm" storage access.

**Gas Constants:**
- `ADDRESS_COST = 2400` - Gas cost per address in access list
- `STORAGE_KEY_COST = 1900` - Gas cost per storage key in access list
- `COLD_ACCOUNT_ACCESS_COST = 2600` - Gas cost for cold account access
- `COLD_STORAGE_ACCESS_COST = 2100` - Gas cost for cold storage access
- `WARM_STORAGE_ACCESS_COST = 100` - Gas cost for warm storage access

## API Reference

### Classes

#### `AccessListEntry`

A single access list entry representing an address and its storage keys.

```python
from voltaire import AccessListEntry

# Create from address and storage keys
entry = AccessListEntry(
    address=bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
    storage_keys=(
        bytes.fromhex("0000000000000000000000000000000000000000000000000000000000000001"),
    )
)

# Access properties
print(entry.address)       # bytes (20 bytes)
print(entry.storage_keys)  # tuple[bytes, ...] (each 32 bytes)
```

**Constructor:**
- `address: bytes` - 20-byte Ethereum address
- `storage_keys: tuple[bytes, ...]` - Tuple of 32-byte storage keys

**Raises:**
- `InvalidLengthError` - Address not 20 bytes or storage key not 32 bytes

#### `AccessList`

An EIP-2930 access list containing multiple entries.

```python
from voltaire import AccessList, AccessListEntry

# Create empty
empty_list = AccessList()

# Create from entries
entries = (
    AccessListEntry(
        address=bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
        storage_keys=(bytes(32),)
    ),
)
access_list = AccessList(entries=entries)
```

### Factory Methods

#### `AccessListEntry.from_dict(d: dict) -> AccessListEntry`

Create an entry from a dictionary (JSON-RPC format).

```python
entry = AccessListEntry.from_dict({
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
    "storageKeys": [
        "0x0000000000000000000000000000000000000000000000000000000000000001"
    ]
})
```

#### `AccessList.from_list(items: list[dict]) -> AccessList`

Create an access list from a list of dictionaries.

```python
access_list = AccessList.from_list([
    {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
        "storageKeys": [
            "0x0000000000000000000000000000000000000000000000000000000000000001"
        ]
    }
])
```

### Instance Methods

#### `AccessListEntry.to_dict() -> dict`

Convert entry to dictionary format.

```python
entry = AccessListEntry(address=bytes(20), storage_keys=())
d = entry.to_dict()
# {"address": "0x0000...", "storageKeys": []}
```

#### `AccessList.to_list() -> list[dict]`

Convert access list to list of dictionaries.

```python
access_list = AccessList.from_list([...])
items = access_list.to_list()
```

#### `AccessList.gas_cost() -> int`

Calculate total gas cost for the access list.

```python
access_list = AccessList.from_list([
    {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
        "storageKeys": [
            "0x0000000000000000000000000000000000000000000000000000000000000001"
        ]
    }
])
cost = access_list.gas_cost()
# cost = 2400 (address) + 1900 (storage key) = 4300
```

**Formula:** `2400 * num_addresses + 1900 * num_storage_keys`

#### `AccessList.address_count() -> int`

Get number of addresses in the access list.

```python
count = access_list.address_count()
```

#### `AccessList.storage_key_count() -> int`

Get total number of storage keys across all entries.

```python
count = access_list.storage_key_count()
```

#### `AccessList.is_empty() -> bool`

Check if the access list is empty.

```python
assert AccessList().is_empty()
```

### Python Protocol Support

#### Iteration

```python
for entry in access_list:
    print(entry.address.hex())
```

#### Length

```python
num_entries = len(access_list)
```

#### Equality

```python
list1 = AccessList.from_list([...])
list2 = AccessList.from_list([...])
assert list1 == list2
```

## Examples

### Basic Usage

```python
from voltaire import AccessList, AccessListEntry

# Create access list for ERC-20 transfer
erc20_access_list = AccessList.from_list([
    {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",  # USDT
        "storageKeys": [
            # balances[from]
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            # balances[to]
            "0x0000000000000000000000000000000000000000000000000000000000000002",
        ]
    }
])

print(f"Gas cost: {erc20_access_list.gas_cost()}")
# Gas cost: 2400 + 2*1900 = 6200
```

### Transaction Building

```python
from voltaire import AccessList, Transaction

# Create access list
access_list = AccessList.from_list([
    {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
        "storageKeys": []
    }
])

# Use in EIP-2930 (type 1) or EIP-1559 (type 2) transaction
# tx = Transaction.create(
#     type=2,
#     access_list=access_list,
#     ...
# )
```

### Gas Savings Analysis

```python
from voltaire import AccessList

# Constants
ADDRESS_COST = 2400
STORAGE_KEY_COST = 1900
COLD_ACCOUNT_ACCESS_COST = 2600
COLD_STORAGE_ACCESS_COST = 2100

access_list = AccessList.from_list([
    {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
        "storageKeys": [
            "0x0000000000000000000000000000000000000000000000000000000000000001"
        ]
    }
])

# Calculate if access list provides savings
access_list_cost = access_list.gas_cost()  # 2400 + 1900 = 4300

# Without access list, you'd pay:
cold_cost = COLD_ACCOUNT_ACCESS_COST + COLD_STORAGE_ACCESS_COST  # 2600 + 2100 = 4700

savings = cold_cost - access_list_cost  # 400 gas saved
print(f"Savings: {savings} gas")
```
