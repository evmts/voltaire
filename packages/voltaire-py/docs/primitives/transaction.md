# Transaction

`voltaire.transaction` defines `TransactionType`, frozen dataclasses for all five Ethereum transaction formats, and the `Transaction` static helper for EIP-2718 type detection and CREATE/CREATE2 contract address calculation.

## `TransactionType` (`IntEnum`)

| Member | Value | Standard |
|--------|-------|----------|
| `TransactionType.LEGACY` | `0` | Pre-EIP-2718 / EIP-155 |
| `TransactionType.EIP2930` | `1` | Access List |
| `TransactionType.EIP1559` | `2` | Fee Market |
| `TransactionType.EIP4844` | `3` | Blob Transaction |
| `TransactionType.EIP7702` | `4` | Set-Code Authorization |

## `Transaction` Static Utilities

| Method | Signature | Behavior |
|--------|-----------|----------|
| `Transaction.detect_type` | `(data: bytes) -> TransactionType` | Classifies raw serialized transaction bytes via `primitives_tx_detect_type` |
| `Transaction.calculate_create_address` | `(sender: Address, nonce: int) -> Address` | Computes CREATE contract address for `(sender, nonce)` |
| `Transaction.calculate_create2_address` | `(sender: Address, salt: bytes, init_code: bytes) -> Address` | Computes CREATE2 address (`len(salt) == 32`) |

`decode_transaction(data: bytes)` currently detects the transaction type and raises `NotImplementedError` pending full RLP transaction decoding in the C FFI.

## Typed Transaction Dataclasses

All transaction classes are `@dataclass(frozen=True, slots=True)` and validate field byte lengths (`to` = 20 B or `None`, `r`/`s` = 32 B, blob hashes = 32 B) in `__post_init__`:

- `LegacyTransaction(nonce, gas_price, gas_limit, to, value, data, v, r, s)` — `.tx_type`, `.is_contract_creation()`
- `EIP2930Transaction(chain_id, nonce, gas_price, gas_limit, to, value, data, access_list, y_parity, r, s)` — `.tx_type`, `.is_contract_creation()`
- `EIP1559Transaction(chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, to, value, data, access_list, y_parity, r, s)` — `.tx_type`, `.is_contract_creation()`, `.effective_gas_price(base_fee)`
- `EIP4844Transaction(..., max_fee_per_blob_gas, blob_versioned_hashes, ...)` — `to` is required (non-`None`), `.effective_gas_price(base_fee)`
- `EIP7702Transaction(..., authorization_list, ...)` — `.effective_gas_price(base_fee)`

## Example

```python
from voltaire import Address, EIP1559Transaction, Transaction, TransactionType

# Detect envelope type
assert Transaction.detect_type(b"\x02\xc0") == TransactionType.EIP1559

# Compute CREATE / CREATE2 deployment addresses
sender = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
addr_create = Transaction.calculate_create_address(sender, nonce=0)
addr_create2 = Transaction.calculate_create2_address(sender, salt=bytes(32), init_code=b"\x60\x00")

# Construct a typed EIP-1559 transaction
tx = EIP1559Transaction(
    chain_id=1,
    nonce=0,
    max_priority_fee_per_gas=2_000_000_000,
    max_fee_per_gas=50_000_000_000,
    gas_limit=21_000,
    to=sender.to_bytes(),
    value=10**18,
    data=b"",
    access_list=(),
    y_parity=0,
    r=bytes(32),
    s=bytes(32),
)
assert tx.effective_gas_price(base_fee=10_000_000_000) == 12_000_000_000
```
