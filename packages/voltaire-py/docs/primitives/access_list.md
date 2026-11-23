# AccessList (EIP-2930)

`voltaire.access_list` provides `AccessListEntry`, `AccessList`, and EIP-2930 gas constants (`ADDRESS_COST = 2400`, `STORAGE_KEY_COST = 1900`, `COLD_ACCOUNT_ACCESS_COST = 2600`, `COLD_STORAGE_ACCESS_COST = 2100`, `WARM_STORAGE_ACCESS_COST = 100`).

## Classes

### `AccessListEntry`

`@dataclass(frozen=True, slots=True)` with `address: bytes` (20 bytes) and `storage_keys: tuple[bytes, ...]` (each 32 bytes).

- `AccessListEntry.from_dict(d: dict) -> AccessListEntry` — parses `{"address": "0x...", "storageKeys": ["0x..."]}`
- `to_dict() -> dict`

### `AccessList`

- `AccessList.from_list(items: Sequence[dict]) -> AccessList`
- `to_list() -> list[dict]`
- `gas_cost() -> int` — computes `2400 * address_count + 1900 * storage_key_count` via `primitives_access_list_gas_cost`
- `address_count() -> int`, `storage_key_count() -> int`, `is_empty() -> bool`
- Supports `len(al)` and iteration `for entry in al:`

## Example

```python
from voltaire import AccessList

al = AccessList.from_list([
    {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "storageKeys": [
            "0x0000000000000000000000000000000000000000000000000000000000000001",
        ],
    }
])

assert al.address_count() == 1
assert al.storage_key_count() == 1
assert al.gas_cost() == 4300  # 2400 + 1900
```
