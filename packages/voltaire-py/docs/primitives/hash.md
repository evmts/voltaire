# Hash

32-byte cryptographic hash type with support for Keccak-256, SHA-256, and EIP-191 message hashing.

## Overview

The `Hash` class represents a 32-byte (256-bit) cryptographic hash value. It provides:

- Immutable, bytes-backed storage
- Constant-time equality comparison
- Hex string conversion
- Hashable for use in sets/dicts

## Hash Functions

### keccak256

Ethereum's primary hash function (Keccak-256, NOT SHA3-256).

```python
from voltaire import keccak256

# Hash a string (UTF-8 encoded)
h = keccak256("hello")
print(h.to_hex())
# 0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8

# Hash bytes
h = keccak256(b"\xde\xad\xbe\xef")

# Hash empty data
h = keccak256(b"")
# 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
```

### sha256

Standard SHA-256 hash function.

```python
from voltaire import sha256

h = sha256("hello")
print(h.to_hex())
# 0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
```

### eip191_hash_message

Hash a message using EIP-191 "personal_sign" format. Prepends the standard Ethereum prefix: `"\x19Ethereum Signed Message:\n" + len(message) + message`.

```python
from voltaire import eip191_hash_message

# For signing with personal_sign
h = eip191_hash_message("Hello, Ethereum!")

# Equivalent to keccak256("\x19Ethereum Signed Message:\n16Hello, Ethereum!")
```

## Hash Class

### Construction

```python
from voltaire import Hash

# From hex string (with or without 0x prefix)
h = Hash.from_hex("0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8")
h = Hash.from_hex("1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8")

# From bytes (must be exactly 32 bytes)
h = Hash.from_bytes(b"\x00" * 32)
```

### Conversion

```python
# To hex string (lowercase, 0x-prefixed)
hex_str = h.to_hex()
# "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"

# To bytes
raw = h.to_bytes()
# b"\x1c\x8a\xff..."
```

### Comparison

Hash comparison uses constant-time comparison to prevent timing attacks.

```python
h1 = keccak256("hello")
h2 = keccak256("hello")
h3 = keccak256("world")

assert h1 == h2  # Same content
assert h1 != h3  # Different content
```

### Use in Collections

Hash is hashable and can be used in sets and as dict keys.

```python
seen = set()
seen.add(keccak256("tx1"))
seen.add(keccak256("tx2"))

cache = {}
cache[keccak256("data")] = "result"
```

## Known Constants

```python
from voltaire import keccak256

# Empty keccak256 hash
EMPTY_KECCAK = keccak256(b"")
# 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
```

## Function Selectors

Use keccak256 to compute function selectors:

```python
from voltaire import keccak256

# ERC20 transfer selector
sig = "transfer(address,uint256)"
selector = keccak256(sig).to_bytes()[:4]
# b'\xa9\x05\x9c\xbb'
```

## Additional Hash Functions

### blake2b

BLAKE2b is a cryptographic hash function optimized for 64-bit platforms. Used in EIP-152 precompile.

```python
from voltaire import blake2b

# Default 64-byte output
h = blake2b(b"hello")
print(len(h))  # 64

# Empty input
h = blake2b(b"")
# Returns 64-byte hash

# String input (UTF-8 encoded)
h = blake2b("hello")
```

Note: The FFI implementation always produces 64-byte output. For variable-length BLAKE2b, use the Python `hashlib` module.

### ripemd160

RIPEMD-160 produces a 20-byte hash. Used in Bitcoin address derivation (hash160 = RIPEMD160(SHA256(data))).

```python
from voltaire import ripemd160

# Hash bytes
h = ripemd160(b"hello")
print(len(h))  # 20

# Hash string (UTF-8 encoded)
h = ripemd160("abc")

# Bitcoin-style hash160
from voltaire import sha256, ripemd160
pubkey = b"..."  # public key bytes
hash160 = ripemd160(sha256(pubkey).to_bytes())
```

## Solidity-Compatible Hashing

These functions match Solidity's `keccak256(abi.encodePacked(...))` and `sha256(abi.encodePacked(...))` behavior.

### solidity_keccak256

Compute `keccak256(abi.encodePacked(values))`.

```python
from voltaire import solidity_keccak256

# Hash address + uint256 (like Solidity)
h = solidity_keccak256(
    ["address", "uint256"],
    ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000]
)
print(h.to_hex())

# Multiple uint types concatenated compactly
h = solidity_keccak256(["uint8", "uint16"], [0x12, 0x3456])
# Packs as: 0x12 ++ 0x3456 = 0x123456, then keccak256

# String hashing
h = solidity_keccak256(["string"], ["hello"])
# Equivalent to keccak256(bytes("hello"))
```

### solidity_sha256

Compute `sha256(abi.encodePacked(values))`.

```python
from voltaire import solidity_sha256

# Hash packed data with SHA-256
h = solidity_sha256(
    ["address", "uint256"],
    ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000]
)
print(h.to_hex())
```

### Packed Encoding Details

Unlike standard ABI encoding, packed encoding:
- Does NOT pad values to 32 bytes (except array elements)
- Concatenates values directly
- Does NOT include length prefixes for dynamic types

```python
from voltaire import solidity_keccak256, Abi

# These are equivalent:
packed = Abi.encode_packed(["uint8", "uint16"], [0x12, 0x3456])
h1 = keccak256(packed)

h2 = solidity_keccak256(["uint8", "uint16"], [0x12, 0x3456])

assert h1 == h2
```

### Real-World Use Cases

```python
from voltaire import solidity_keccak256

# CREATE2 address derivation
prefix = 0xff
deployer = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
salt = 0x0000000000000000000000000000000000000000000000000000000000000001
bytecode_hash = "0x" + "aa" * 32
h = solidity_keccak256(
    ["uint8", "address", "uint256", "bytes32"],
    [prefix, deployer, salt, bytecode_hash]
)

# Permit signature message
owner = "0x0000000000000000000000000000000000000001"
spender = "0x0000000000000000000000000000000000000002"
value = 1000000000000000000
h = solidity_keccak256(
    ["address", "address", "uint256"],
    [owner, spender, value]
)
```

## Error Handling

```python
from voltaire import Hash
from voltaire.errors import InvalidHexError, InvalidLengthError, InvalidInputError

# Invalid hex
try:
    Hash.from_hex("0xinvalid")
except InvalidHexError:
    pass

# Wrong length
try:
    Hash.from_bytes(b"too short")
except InvalidLengthError:
    pass

# Type/value mismatch in solidity hashing
try:
    solidity_keccak256(["uint256"], [])  # Missing value
except InvalidInputError:
    pass
```
