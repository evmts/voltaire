# Transaction

Ethereum transaction types and utilities for type detection, serialization, and address calculation.

## Overview

The `Transaction` module provides:

- **Transaction Dataclasses**: Strongly-typed representations of all Ethereum transaction types
- **Type Detection**: Identify transaction types from raw bytes
- **CREATE Address**: Calculate contract addresses from CREATE opcode
- **CREATE2 Address**: Calculate deterministic contract addresses

## Transaction Types

Ethereum supports five transaction formats:

| Type | Class | EIP | Description |
|------|-------|-----|-------------|
| 0 | `LegacyTransaction` | Pre-EIP-2718 | Original format with fixed gas price |
| 1 | `EIP2930Transaction` | [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) | Access list for gas optimization |
| 2 | `EIP1559Transaction` | [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) | Fee market with priority fee |
| 3 | `EIP4844Transaction` | [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) | Blob transactions for L2 scaling |
| 4 | `EIP7702Transaction` | [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) | EOA code delegation |

## API Reference

### TransactionType Enum

```python
from voltaire import TransactionType

class TransactionType(IntEnum):
    LEGACY = 0    # Pre-EIP-2718 legacy transaction
    EIP2930 = 1   # Access list transaction
    EIP1559 = 2   # Fee market transaction
    EIP4844 = 3   # Blob transaction
    EIP7702 = 4   # Set code transaction
```

### LegacyTransaction

Type 0 (legacy) transaction - the original Ethereum transaction format.

```python
from voltaire import LegacyTransaction

@dataclass(frozen=True, slots=True)
class LegacyTransaction:
    nonce: int              # Transaction sequence number
    gas_price: int          # Gas price in wei
    gas_limit: int          # Maximum gas to use
    to: bytes | None        # Recipient (None for contract creation)
    value: int              # ETH value in wei
    data: bytes             # Input data / contract bytecode
    v: int                  # Signature recovery id
    r: bytes                # Signature r component (32 bytes)
    s: bytes                # Signature s component (32 bytes)
```

**Example:**
```python
from voltaire import LegacyTransaction

# Simple ETH transfer
tx = LegacyTransaction(
    nonce=0,
    gas_price=20_000_000_000,  # 20 gwei
    gas_limit=21000,
    to=bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
    value=1_000_000_000_000_000_000,  # 1 ETH
    data=b"",
    v=27,
    r=bytes(32),
    s=bytes(32),
)

# Contract deployment (to=None)
deploy_tx = LegacyTransaction(
    nonce=1,
    gas_price=20_000_000_000,
    gas_limit=500_000,
    to=None,  # Contract creation
    value=0,
    data=bytes.fromhex("6080604052..."),
    v=27,
    r=bytes(32),
    s=bytes(32),
)
```

### EIP2930Transaction

Type 1 transaction with access list support (EIP-2930).

```python
from voltaire import EIP2930Transaction, AccessList

@dataclass(frozen=True, slots=True)
class EIP2930Transaction:
    chain_id: int           # Network chain ID
    nonce: int              # Transaction sequence number
    gas_price: int          # Gas price in wei
    gas_limit: int          # Maximum gas to use
    to: bytes | None        # Recipient address
    value: int              # ETH value in wei
    data: bytes             # Input data
    access_list: AccessList # Pre-declared storage access
    v: int                  # y-parity (0 or 1)
    r: bytes                # Signature r component
    s: bytes                # Signature s component
```

**Example:**
```python
from voltaire import EIP2930Transaction, AccessList

tx = EIP2930Transaction(
    chain_id=1,
    nonce=5,
    gas_price=30_000_000_000,  # 30 gwei
    gas_limit=50_000,
    to=bytes.fromhex("6B175474E89094C44Da98b954EedeAC495271d0F"),  # DAI
    value=0,
    data=bytes.fromhex("a9059cbb"),  # transfer selector
    access_list=AccessList.from_list([
        {
            "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            "storageKeys": ["0x" + "00" * 32]
        }
    ]),
    v=0,
    r=bytes(32),
    s=bytes(32),
)
```

### EIP1559Transaction

Type 2 transaction with dynamic fee market (EIP-1559).

```python
from voltaire import EIP1559Transaction

@dataclass(frozen=True, slots=True)
class EIP1559Transaction:
    chain_id: int                  # Network chain ID
    nonce: int                     # Transaction sequence number
    max_priority_fee_per_gas: int  # Priority fee (tip) in wei
    max_fee_per_gas: int           # Maximum total fee in wei
    gas_limit: int                 # Maximum gas to use
    to: bytes | None               # Recipient address
    value: int                     # ETH value in wei
    data: bytes                    # Input data
    access_list: AccessList        # Pre-declared storage access
    v: int                         # y-parity (0 or 1)
    r: bytes                       # Signature r component
    s: bytes                       # Signature s component
```

**Example:**
```python
from voltaire import EIP1559Transaction, AccessList

tx = EIP1559Transaction(
    chain_id=1,
    nonce=42,
    max_priority_fee_per_gas=2_000_000_000,  # 2 gwei tip
    max_fee_per_gas=30_000_000_000,          # 30 gwei max
    gas_limit=21_000,
    to=bytes.fromhex("742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
    value=1_000_000_000_000_000_000,  # 1 ETH
    data=b"",
    access_list=AccessList(),
    v=0,
    r=bytes(32),
    s=bytes(32),
)

# Effective gas price = base_fee + min(priority_fee, max_fee - base_fee)
```

### EIP4844Transaction

Type 3 blob transaction for L2 data availability (EIP-4844).

```python
from voltaire import EIP4844Transaction

@dataclass(frozen=True, slots=True)
class EIP4844Transaction:
    chain_id: int                  # Network chain ID
    nonce: int                     # Transaction sequence number
    max_priority_fee_per_gas: int  # Priority fee in wei
    max_fee_per_gas: int           # Maximum fee in wei
    gas_limit: int                 # Maximum gas
    to: bytes                      # Recipient (required, cannot be None)
    value: int                     # ETH value in wei
    data: bytes                    # Input data
    access_list: AccessList        # Pre-declared storage access
    max_fee_per_blob_gas: int      # Maximum blob gas fee
    blob_versioned_hashes: tuple[bytes, ...]  # 32-byte blob hashes
    v: int                         # y-parity
    r: bytes                       # Signature r
    s: bytes                       # Signature s
```

**Example:**
```python
from voltaire import EIP4844Transaction, AccessList

# L2 batch submission with blob
tx = EIP4844Transaction(
    chain_id=1,
    nonce=100,
    max_priority_fee_per_gas=1_000_000_000,
    max_fee_per_gas=50_000_000_000,
    gas_limit=100_000,
    to=bytes.fromhex("000000000000000000000000000000000000dead"),
    value=0,
    data=b"",
    access_list=AccessList(),
    max_fee_per_blob_gas=10_000_000_000,
    blob_versioned_hashes=(
        bytes.fromhex("01" + "00" * 31),  # Versioned hash (version byte + hash)
    ),
    v=0,
    r=bytes(32),
    s=bytes(32),
)
```

### EIP7702Transaction

Type 4 transaction for EOA code delegation (EIP-7702).

```python
from voltaire import EIP7702Transaction, Authorization

@dataclass(frozen=True, slots=True)
class EIP7702Transaction:
    chain_id: int                  # Network chain ID
    nonce: int                     # Transaction sequence number
    max_priority_fee_per_gas: int  # Priority fee in wei
    max_fee_per_gas: int           # Maximum fee in wei
    gas_limit: int                 # Maximum gas
    to: bytes | None               # Recipient address
    value: int                     # ETH value in wei
    data: bytes                    # Input data
    access_list: AccessList        # Pre-declared storage access
    authorization_list: tuple[Authorization, ...]  # Code delegations
    v: int                         # y-parity
    r: bytes                       # Signature r
    s: bytes                       # Signature s
```

**Example:**
```python
from voltaire import EIP7702Transaction, Authorization, AccessList

# Delegate EOA to smart contract wallet
auth = Authorization(
    chain_id=1,
    address=bytes.fromhex("...smart_wallet_impl..."),
    nonce=0,
    v=27,
    r=bytes(32),
    s=bytes(32),
)

tx = EIP7702Transaction(
    chain_id=1,
    nonce=0,
    max_priority_fee_per_gas=2_000_000_000,
    max_fee_per_gas=30_000_000_000,
    gas_limit=100_000,
    to=bytes.fromhex("..."),
    value=0,
    data=b"",
    access_list=AccessList(),
    authorization_list=(auth,),
    v=0,
    r=bytes(32),
    s=bytes(32),
)
```

### Transaction.detect_type

Detect transaction type from serialized bytes.

```python
@staticmethod
def detect_type(data: bytes) -> TransactionType
```

**Arguments:**
- `data`: Serialized transaction bytes

**Returns:** `TransactionType` enum value

**Detection Logic:**
```
First byte:
  0x01 -> EIP-2930 (Access List)
  0x02 -> EIP-1559 (Fee Market)
  0x03 -> EIP-4844 (Blob)
  0x04 -> EIP-7702 (Set Code)
  >= 0xc0 -> Legacy (RLP list prefix)
```

**Example:**
```python
from voltaire import Transaction, TransactionType

# EIP-1559 transaction
tx_data = bytes.fromhex("02f8...")
assert Transaction.detect_type(tx_data) == TransactionType.EIP1559

# Legacy transaction (RLP list prefix)
legacy_data = bytes.fromhex("f86c...")
assert Transaction.detect_type(legacy_data) == TransactionType.LEGACY
```

### decode_transaction

Decode any transaction type from raw bytes.

```python
def decode_transaction(
    data: bytes
) -> LegacyTransaction | EIP2930Transaction | EIP1559Transaction | EIP4844Transaction | EIP7702Transaction
```

**Example:**
```python
from voltaire import decode_transaction, LegacyTransaction

raw_tx = bytes.fromhex("f86c...")
tx = decode_transaction(raw_tx)

if isinstance(tx, LegacyTransaction):
    print(f"Legacy tx, nonce={tx.nonce}")
```

### Transaction.calculate_create_address

Calculate contract address from CREATE opcode.

```python
@staticmethod
def calculate_create_address(sender: Address, nonce: int) -> Address
```

**Formula:** `keccak256(RLP([sender, nonce]))[12:]`

**Example:**
```python
from voltaire import Transaction, Address

sender = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
contract = Transaction.calculate_create_address(sender, 0)
print(f"First contract: {contract.to_checksum()}")
```

### Transaction.calculate_create2_address

Calculate deterministic contract address from CREATE2.

```python
@staticmethod
def calculate_create2_address(
    sender: Address,
    salt: bytes,
    init_code: bytes
) -> Address
```

**Formula:** `keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]`

**Example:**
```python
from voltaire import Transaction, Address

factory = Address.from_hex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
salt = bytes(32)
init_code = bytes.fromhex("608060...")

contract = Transaction.calculate_create2_address(factory, salt, init_code)
```

## Usage Patterns

### Processing Raw Transactions

```python
from voltaire import (
    Transaction, TransactionType, decode_transaction,
    LegacyTransaction, EIP1559Transaction
)

def process_transaction(raw_tx: bytes) -> dict:
    """Process any transaction type."""
    tx_type = Transaction.detect_type(raw_tx)
    tx = decode_transaction(raw_tx)

    result = {
        "type": tx_type.name,
        "nonce": tx.nonce,
        "gas_limit": tx.gas_limit,
    }

    if tx_type == TransactionType.LEGACY:
        result["gas_price"] = tx.gas_price
    elif tx_type in (TransactionType.EIP1559, TransactionType.EIP4844):
        result["max_fee"] = tx.max_fee_per_gas
        result["priority_fee"] = tx.max_priority_fee_per_gas

    return result
```

### Fee Calculation (EIP-1559)

```python
from voltaire import EIP1559Transaction

def calculate_effective_gas_price(
    tx: EIP1559Transaction,
    base_fee: int
) -> int:
    """Calculate the actual gas price paid."""
    # effectiveGasPrice = baseFee + min(priorityFee, maxFee - baseFee)
    priority = min(tx.max_priority_fee_per_gas, tx.max_fee_per_gas - base_fee)
    return base_fee + priority

def estimate_max_cost(tx: EIP1559Transaction) -> int:
    """Maximum ETH that could be spent (for balance checks)."""
    return tx.max_fee_per_gas * tx.gas_limit + tx.value
```

### Predicting Contract Addresses

```python
from voltaire import Transaction, Address

def get_deployed_addresses(deployer: Address, count: int) -> list[Address]:
    """Get addresses for first N contracts deployed by an account."""
    return [
        Transaction.calculate_create_address(deployer, nonce)
        for nonce in range(count)
    ]

# For deterministic deployments (CREATE2)
def predict_counterfactual_address(
    factory: Address,
    owner: bytes,
    init_code: bytes
) -> Address:
    """Predict address using owner as salt."""
    salt = owner.rjust(32, b'\x00')
    return Transaction.calculate_create2_address(factory, salt, init_code)
```

### Transaction Validation

```python
from voltaire import (
    LegacyTransaction, EIP1559Transaction,
    SECP256K1_N, SECP256K1_HALF_N
)

def validate_signature(tx: LegacyTransaction | EIP1559Transaction) -> bool:
    """Validate transaction signature components."""
    r = int.from_bytes(tx.r, "big")
    s = int.from_bytes(tx.s, "big")

    # r and s must be in valid range
    if not (0 < r < SECP256K1_N and 0 < s < SECP256K1_N):
        return False

    # s must be low (EIP-2)
    if s > SECP256K1_HALF_N:
        return False

    return True
```

## Serialization

### Transaction Encoding

```python
# Each transaction type has to_bytes() for serialization
from voltaire import LegacyTransaction, EIP1559Transaction

legacy_tx = LegacyTransaction(...)
raw = legacy_tx.to_bytes()  # RLP([nonce, gasPrice, ...])

eip1559_tx = EIP1559Transaction(...)
raw = eip1559_tx.to_bytes()  # 0x02 || RLP([chainId, nonce, ...])
```

### Transaction Decoding

```python
from voltaire import LegacyTransaction, EIP1559Transaction

# Decode specific type
legacy_tx = LegacyTransaction.from_bytes(raw_legacy)
eip1559_tx = EIP1559Transaction.from_bytes(raw_eip1559)

# Or use the generic decoder
from voltaire import decode_transaction
tx = decode_transaction(raw_any_type)
```

## Notes

- All transaction dataclasses are immutable (`frozen=True`)
- `to=None` indicates contract creation (except EIP-4844 which requires a recipient)
- Signature components (v, r, s) use raw values; v is y-parity (0 or 1) for typed transactions
- Access lists and authorization lists are tuples for immutability
- Full RLP encoding/decoding requires additional C FFI support
