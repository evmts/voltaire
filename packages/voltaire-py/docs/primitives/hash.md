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

## Error Handling

```python
from voltaire import Hash
from voltaire.errors import InvalidHexError, InvalidLengthError

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
```
