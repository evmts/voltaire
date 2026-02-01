# voltaire-py

Python bindings for Voltaire Ethereum primitives and cryptography.

## Installation

```bash
pip install voltaire
```

## Quick Start

```python
from voltaire import Address, keccak256, Secp256k1

# Parse and validate addresses
addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
print(addr.to_checksum())  # EIP-55 checksummed

# Hash data
hash = keccak256(b"hello world")
print(hash.hex())

# Sign and recover
message_hash = keccak256(b"sign me")
signature = Secp256k1.sign(message_hash, private_key)
recovered = Secp256k1.recover_address(message_hash, signature)
```

## Modules

- **Address** - Ethereum address parsing, validation, checksumming
- **Hash** - Keccak-256, SHA-256, and other hash functions
- **Hex** - Hex string encoding/decoding utilities
- **Uint256** - 256-bit unsigned integer operations
- **Secp256k1** - ECDSA signing, verification, key recovery

## Building from Source

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

## Testing

```bash
pytest
```

## License

MIT
