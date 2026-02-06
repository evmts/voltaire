# voltaire-py

Python bindings for Voltaire's high-performance Ethereum primitives and cryptography.

## Installation

```bash
pip install voltaire
```

## Quick Start

```python
from voltaire import Address, keccak256, Secp256k1, Signature

# Parse and validate addresses
addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
print(addr.to_checksum())  # EIP-55 checksummed

# Hash data
hash = keccak256(b"hello world")
print(hash.to_hex())

# Recover signer from signature
message_hash = keccak256(b"sign me")
signature = Signature(r=r_bytes, s=s_bytes, v=27)
recovered = Secp256k1.recover_address(message_hash, signature)
```

## Modules

### Primitives

| Module | Description |
|--------|-------------|
| **Address** | 20-byte Ethereum address with EIP-55 checksum |
| **Hash** | Keccak-256, SHA-256, BLAKE2b, RIPEMD-160, EIP-191 |
| **Hex** | Hex string encoding/decoding |
| **Uint256** | 256-bit unsigned integer operations |
| **Rlp** | RLP encoding/decoding |
| **Abi** | ABI encoding/decoding, function selectors |
| **Transaction** | Type detection, CREATE/CREATE2 address calculation |
| **AccessList** | EIP-2930 access lists |
| **Authorization** | EIP-7702 authorization tuples |
| **EventLog** | Event log filtering and matching |
| **Blob** | EIP-4844 blob handling |
| **Bytecode** | EVM bytecode analysis |

### Cryptography

| Module | Description |
|--------|-------------|
| **Secp256k1** | ECDSA signing, verification, key recovery |
| **SignatureUtils** | Signature normalization, parsing, serialization |

## Examples

### Address Operations

```python
from voltaire import Address

# Parse from hex (case-insensitive)
addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")

# Get checksummed format
print(addr.to_checksum())  # 0xA0Cf798816D4b9b9866b5330EEa46a18382f251e

# Validate checksum
assert Address.validate_checksum("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e")

# Check for zero address
assert Address.zero().is_zero()

# Use in collections
addresses = {addr}  # Hashable
```

### Hashing

```python
from voltaire import keccak256, sha256, eip191_hash_message

# Keccak-256 (Ethereum's hash function)
h = keccak256(b"hello")
print(h.to_hex())

# EIP-191 personal sign hash
h = eip191_hash_message("Hello, Ethereum!")

# Function selector
selector = keccak256("transfer(address,uint256)").to_bytes()[:4]
```

### ABI Encoding

```python
from voltaire import Abi

# Encode function call
calldata = Abi.encode_function_data(
    "transfer(address,uint256)",
    ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000000000000000000]
)

# Decode parameters
values = Abi.decode_parameters(
    ["address", "uint256"],
    encoded_data
)

# Packed encoding (like abi.encodePacked)
packed = Abi.encode_packed(["address", "uint256"], [addr, amount])
```

### RLP Encoding

```python
from voltaire import Rlp, rlp_encode

# Encode various types
Rlp.encode_bytes(b"dog")   # b"\x83dog"
Rlp.encode_uint(1024)      # b"\x82\x04\x00"

# Encode nested lists
rlp_encode([[b"a"], [b"b", b"c"]])
```

### Transaction Utilities

```python
from voltaire import Transaction, TransactionType, Address

# Detect transaction type
tx_type = Transaction.detect_type(raw_tx_bytes)
if tx_type == TransactionType.EIP1559:
    print("Fee market transaction")

# Calculate CREATE address
sender = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
contract_addr = Transaction.calculate_create_address(sender, nonce=0)

# Calculate CREATE2 address (deterministic)
contract_addr = Transaction.calculate_create2_address(
    factory_address,
    salt=bytes(32),
    init_code=bytecode
)
```

### Signature Operations

```python
from voltaire import Secp256k1, Signature, SignatureUtils

# Recover address from signature
signature = Signature(r=r_bytes, s=s_bytes, v=27)
address = Secp256k1.recover_address(message_hash, signature)

# Normalize signature to EIP-2 low-s form
r, s, was_normalized = SignatureUtils.normalize(r_bytes, s_bytes)

# Check if already canonical
is_valid = SignatureUtils.is_canonical(r_bytes, s_bytes)

# Parse compact signature
components = SignatureUtils.parse(sig_65_bytes)
```

### Access Lists (EIP-2930)

```python
from voltaire import AccessList, AccessListEntry

# Create access list
access_list = AccessList.from_list([
    {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "storageKeys": [
            "0x0000000000000000000000000000000000000000000000000000000000000001"
        ]
    }
])

# Calculate gas cost
gas = access_list.gas_cost()  # 2400 + 1900 = 4300
```

### Blobs (EIP-4844)

```python
from voltaire import Blob

# Encode data into blob
blob = Blob.from_data(b"rollup data...")

# Decode back
original = blob.to_data()

# Estimate gas
blob_count = Blob.estimate_count(data_size)
gas = Blob.calculate_gas(blob_count)
```

### Bytecode Analysis

```python
from voltaire import Bytecode

# Analyze bytecode
bytecode = Bytecode.from_hex("0x6080604052...")

# Check valid jump destinations
if bytecode.is_valid_jumpdest(pc):
    print("Valid jump target")

# Validate structure
if bytecode.validate():
    print("All PUSH instructions have complete data")
```

## Error Handling

```python
from voltaire import (
    Address,
    VoltaireError,
    InvalidHexError,
    InvalidLengthError,
    InvalidChecksumError,
    InvalidSignatureError,
    InvalidInputError,
    InvalidAuthorizationError,
)

try:
    addr = Address.from_hex("invalid")
except InvalidHexError:
    print("Invalid hex characters")
except InvalidLengthError:
    print("Wrong byte length")
```

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

## Documentation

Full documentation available at [docs/index.md](docs/index.md).

## License

MIT
