# Authorization (EIP-7702)

`Authorization` (`voltaire.authorization`) represents a signed EIP-7702 EOA code-delegation tuple (`@dataclass(frozen=True, slots=True)`).

## Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| `MAGIC_BYTE` | `0x05` | EIP-7702 signing domain prefix |
| `PER_AUTH_BASE_COST` | `12500` | Base gas cost per authorization |
| `PER_EMPTY_ACCOUNT_COST` | `25000` | Additional gas cost per empty delegated account |
| `SECP256K1_N` | Curve order | Maximum valid `r`/`s` bound |
| `SECP256K1_HALF_N` | `SECP256K1_N // 2` | EIP-2 low-`s` upper bound |

## Fields and Methods

```python
@dataclass(frozen=True, slots=True)
class Authorization:
    chain_id: int   # 0 for cross-chain
    address: bytes  # 20-byte target contract address
    nonce: int
    y_parity: int   # 0 or 1
    r: bytes        # 32 bytes
    s: bytes        # 32 bytes
```

| Method | Signature | Behavior |
|--------|-----------|----------|
| `validate` | `() -> bool` | Checks non-zero `address`, `y_parity in (0, 1)`, valid `r`, canonical low-`s`; raises `InvalidAuthorizationError` |
| `signing_hash` | `() -> bytes` | Computes 32-byte `keccak256(0x05 \|\| rlp([chain_id, address, nonce]))` via FFI |
| `recover_authority` | `() -> bytes` | Recovers the 20-byte authorizing EOA address via FFI |
| `Authorization.gas_cost` | `(auth_count: int, empty_accounts: int = 0) -> int` | Computes intrinsic gas cost via `primitives_authorization_gas_cost` |
| `Authorization.from_dict` / `to_dict` | — | JSON-RPC dict conversion (`chainId`, `address`, `nonce`, `yParity`, `r`, `s`) |

## Example

```python
from voltaire import Authorization

auth = Authorization(
    chain_id=1,
    address=bytes.fromhex("1234567890123456789012345678901234567890"),
    nonce=0,
    y_parity=0,
    r=bytes.fromhex("00" * 31 + "01"),
    s=bytes.fromhex("00" * 31 + "01"),
)

assert auth.validate() is True
digest = auth.signing_hash()         # 32 bytes
gas = Authorization.gas_cost(1, 0)   # 12500
```
