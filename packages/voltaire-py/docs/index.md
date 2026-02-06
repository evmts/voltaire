# voltaire-py Documentation

Python bindings for Voltaire's high-performance Ethereum primitives and cryptography.

## Overview

voltaire-py provides type-safe Python access to Voltaire's native Zig/C implementation of Ethereum primitives. This delivers significant performance improvements over pure Python implementations while maintaining a Pythonic API.

Key features:
- **High Performance**: Native FFI bindings to optimized Zig/C code
- **Type Safety**: Full type hints and runtime validation
- **Comprehensive**: Complete coverage of Ethereum primitives and cryptography
- **Standards Compliant**: Implements EIP-55, EIP-191, EIP-712, EIP-2, EIP-2930, EIP-4844, EIP-7702

## Installation

```bash
pip install voltaire
```

### Building from Source

Requires the Voltaire native library:

```bash
# From repo root
zig build build-ts-native

# Set library path
export VOLTAIRE_LIB_PATH=/path/to/libprimitives.dylib

# Install Python package
cd packages/voltaire-py
pip install -e ".[dev]"
```

## Quick Start

```python
from voltaire import Address, keccak256, Secp256k1, Signature

# Parse and validate Ethereum addresses
addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
print(addr.to_checksum())  # EIP-55 checksummed

# Hash data with Keccak-256
hash = keccak256(b"hello world")
print(hash.to_hex())

# Sign and recover addresses
message_hash = keccak256(b"sign me")
# signature = Secp256k1.sign(message_hash, private_key)
# recovered = Secp256k1.recover_address(message_hash, signature)
```

## Module Reference

### Primitives

Core Ethereum data types and utilities.

| Module | Description | Documentation |
|--------|-------------|---------------|
| [Address](primitives/address.md) | 20-byte Ethereum address with EIP-55 checksum | Parsing, validation, checksumming |
| [Hash](primitives/hash.md) | 32-byte hash values | Keccak-256, SHA-256, BLAKE2b, RIPEMD-160, EIP-191 |
| [Hex](primitives/hex.md) | Hex encoding/decoding | Encode, decode, validate hex strings |
| [Uint256](primitives/uint256.md) | 256-bit unsigned integers | Big-endian, comparison, conversion |
| [RLP](primitives/rlp.md) | Recursive Length Prefix encoding | Encode/decode bytes, integers, lists |
| [ABI](primitives/abi.md) | Application Binary Interface | Encode/decode parameters, function selectors |
| [Transaction](primitives/transaction.md) | Transaction utilities | Type detection, CREATE/CREATE2 addresses |
| [AccessList](primitives/access_list.md) | EIP-2930 access lists | Gas optimization, storage key management |
| [Authorization](primitives/authorization.md) | EIP-7702 authorization tuples | Account abstraction, signing hash |
| [EventLog](primitives/eventlog.md) | Event log representation | Filtering, topic matching |
| [Blob](primitives/blob.md) | EIP-4844 blob handling | Data availability, gas calculation |
| [Bytecode](primitives/bytecode.md) | EVM bytecode analysis | JUMPDEST analysis, validation |

### Cryptography

Cryptographic operations for Ethereum.

| Module | Description | Documentation |
|--------|-------------|---------------|
| [Secp256k1](crypto/secp256k1.md) | ECDSA operations | Key derivation, signature recovery |
| [Keys](crypto/keys.md) | Key generation | Private key generation, public key compression |
| [Signature](crypto/signature.md) | Signature utilities | EIP-2 normalization, parsing, serialization |

## Error Handling

All voltaire-py functions raise typed exceptions on error:

```python
from voltaire import Address, InvalidHexError, InvalidLengthError

try:
    addr = Address.from_hex("invalid")
except InvalidHexError as e:
    print(f"Invalid hex: {e}")
except InvalidLengthError as e:
    print(f"Wrong length: {e}")
```

### Exception Hierarchy

```
VoltaireError (base)
├── InvalidHexError       # Invalid hex characters
├── InvalidLengthError    # Wrong byte length
├── InvalidChecksumError  # EIP-55 checksum mismatch
├── InvalidSignatureError # Invalid ECDSA signature
├── InvalidInputError     # General invalid input
└── InvalidAuthorizationError  # EIP-7702 authorization invalid
```

## Constants

voltaire-py exports commonly used constants:

```python
from voltaire import (
    # Access list gas costs (EIP-2930)
    ADDRESS_COST,           # 2400 gas
    STORAGE_KEY_COST,       # 1900 gas
    COLD_ACCOUNT_ACCESS_COST,  # 2600 gas
    COLD_STORAGE_ACCESS_COST,  # 2100 gas
    WARM_STORAGE_ACCESS_COST,  # 100 gas

    # Blob constants (EIP-4844)
    BLOB_SIZE,              # 131072 bytes
    FIELD_ELEMENTS_PER_BLOB,  # 4096
    BYTES_PER_FIELD_ELEMENT,  # 32
    MAX_DATA_PER_BLOB,      # 126972 bytes
    GAS_PER_BLOB,           # 131072 gas
    TARGET_BLOBS_PER_BLOCK, # 3

    # Authorization constants (EIP-7702)
    MAGIC_BYTE,             # 0x05
    PER_AUTH_BASE_COST,     # 12500 gas
    PER_EMPTY_ACCOUNT_COST, # 25000 gas
    SECP256K1_N,            # Curve order
    SECP256K1_HALF_N,       # N/2 for low-s check
)
```

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=voltaire

# Run specific test file
pytest tests/test_address.py
```

## Performance

voltaire-py uses native FFI bindings for performance-critical operations:

| Operation | voltaire-py | Pure Python |
|-----------|-------------|-------------|
| keccak256 | ~0.5us | ~10us |
| Address checksum | ~0.3us | ~5us |
| Signature recovery | ~50us | ~500us |

## See Also

- [Voltaire Main Repository](https://github.com/voltaire-project/voltaire)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
- [EIP-191: Signed data standard](https://eips.ethereum.org/EIPS/eip-191)
- [EIP-2930: Access list transactions](https://eips.ethereum.org/EIPS/eip-2930)
- [EIP-4844: Blob transactions](https://eips.ethereum.org/EIPS/eip-4844)
- [EIP-7702: Set code transactions](https://eips.ethereum.org/EIPS/eip-7702)

## License

MIT
