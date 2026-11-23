# Hash

`voltaire.hash` defines the 32-byte `Hash` value type and FFI-backed cryptographic hash functions: Keccak-256, EIP-191 personal message hashing, SHA-256, BLAKE2b-512, RIPEMD-160, and Solidity packed hashing.

## `Hash` Class

| Method | Signature | Description |
|--------|-----------|-------------|
| `Hash.from_hex` | `(hex_str: str) -> Hash` | Parses 64 hex chars (optional `0x`); raises `InvalidHexError` / `InvalidLengthError` |
| `Hash.from_bytes` | `(data: bytes) -> Hash` | Copies 32 bytes; raises `InvalidLengthError` otherwise |
| `to_hex()` | `() -> str` | Lowercase `"0x"` + 64 hex chars |
| `to_bytes()` | `() -> bytes` | 32 raw bytes |
| `==`, `hash()` | — | Constant-time equality via `primitives_hash_equals`; hashable for sets/dicts |

## Hash Functions

All single-input functions accept `bytes | str` (strings are UTF-8 encoded):

| Function | Signature | Return Type & Length |
|----------|-----------|----------------------|
| `keccak256` | `(data: bytes \| str) -> Hash` | `Hash` (32 bytes) |
| `sha256` | `(data: bytes \| str) -> Hash` | `Hash` (32 bytes) |
| `eip191_hash_message` | `(message: bytes \| str) -> Hash` | `Hash` (32 bytes, `"\x19Ethereum Signed Message:\n" + len + msg`) |
| `blake2b` | `(data: bytes \| str) -> bytes` | `bytes` (64 bytes, BLAKE2b-512) |
| `ripemd160` | `(data: bytes \| str) -> bytes` | `bytes` (20 bytes) |
| `solidity_keccak256` | `(types: list[str], values: list) -> Hash` | `Hash` (32 bytes over `Abi.encode_packed`) |
| `solidity_sha256` | `(types: list[str], values: list) -> Hash` | `Hash` (32 bytes over `Abi.encode_packed`) |

## Example

```python
from voltaire import (
    Hash,
    keccak256,
    sha256,
    eip191_hash_message,
    blake2b,
    ripemd160,
    solidity_keccak256,
)

h = keccak256(b"hello")
assert h.to_hex() == "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
assert h == Hash.from_hex(h.to_hex())

personal = eip191_hash_message("Hello, Ethereum!")
digest_sha = sha256(b"hello")
digest_b2 = blake2b(b"hello")      # 64 bytes
digest_r160 = ripemd160(b"hello")  # 20 bytes

packed_hash = solidity_keccak256(
    ["address", "uint256"],
    ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 100],
)
```
