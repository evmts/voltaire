# Transaction

Ethereum transaction type detection and address calculation utilities.

## Overview

The `Transaction` module provides utilities for working with Ethereum transactions:

- **Type Detection**: Identify transaction types (Legacy, EIP-2930, EIP-1559, EIP-4844, EIP-7702)
- **CREATE Address**: Calculate contract addresses from CREATE opcode
- **CREATE2 Address**: Calculate deterministic contract addresses from CREATE2 opcode

## Transaction Types

Ethereum supports multiple transaction formats, each identified by a type byte:

| Type | Name | EIP | Description |
|------|------|-----|-------------|
| 0 | Legacy | Pre-EIP-2718 | Original format, RLP-encoded |
| 1 | EIP-2930 | [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) | Access list transactions |
| 2 | EIP-1559 | [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) | Fee market (priority fee) |
| 3 | EIP-4844 | [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) | Blob transactions |
| 4 | EIP-7702 | [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) | Set code transactions |

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

### Transaction.detect_type

Detect the transaction type from serialized transaction data.

```python
@staticmethod
def detect_type(data: bytes) -> TransactionType
```

**Arguments:**
- `data`: Serialized transaction bytes (RLP-encoded)

**Returns:** `TransactionType` enum value

**Raises:**
- `InvalidInputError`: If data is empty or invalid

**Example:**
```python
from voltaire import Transaction, TransactionType

# EIP-1559 transaction (type byte 0x02)
tx_data = bytes.fromhex("02f8...")
tx_type = Transaction.detect_type(tx_data)
assert tx_type == TransactionType.EIP1559

# Legacy transaction (RLP list, first byte >= 0xc0)
legacy_data = bytes.fromhex("f86c...")
tx_type = Transaction.detect_type(legacy_data)
assert tx_type == TransactionType.LEGACY
```

### Transaction.calculate_create_address

Calculate the contract address that would be created by a CREATE opcode.

```python
@staticmethod
def calculate_create_address(sender: Address, nonce: int) -> Address
```

**Arguments:**
- `sender`: The address deploying the contract
- `nonce`: The deployer's transaction nonce

**Returns:** The address where the contract will be deployed

**Formula:** `keccak256(RLP([sender, nonce]))[12:]`

**Example:**
```python
from voltaire import Transaction, Address

sender = Address.from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
nonce = 0

# Calculate CREATE address
contract_addr = Transaction.calculate_create_address(sender, nonce)
print(f"Contract: {contract_addr.to_checksum()}")
```

### Transaction.calculate_create2_address

Calculate the deterministic contract address from CREATE2.

```python
@staticmethod
def calculate_create2_address(
    sender: Address,
    salt: bytes,
    init_code: bytes
) -> Address
```

**Arguments:**
- `sender`: The factory contract address
- `salt`: 32-byte salt value
- `init_code`: Contract initialization bytecode

**Returns:** The deterministic address where the contract will be deployed

**Formula:** `keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]`

**Example:**
```python
from voltaire import Transaction, Address

factory = Address.from_hex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
salt = bytes(32)  # 32 zero bytes
init_code = bytes.fromhex("608060...")

# Calculate CREATE2 address (deterministic)
contract_addr = Transaction.calculate_create2_address(factory, salt, init_code)
```

## Type Detection Details

Transaction type is detected from the first byte of serialized data:

```
First byte:
  0x01 -> EIP-2930 (Access List)
  0x02 -> EIP-1559 (Fee Market)
  0x03 -> EIP-4844 (Blob)
  0x04 -> EIP-7702 (Set Code)
  >= 0xc0 -> Legacy (RLP list prefix)
```

## Examples

### Detecting Transaction Type

```python
from voltaire import Transaction, TransactionType

def process_transaction(raw_tx: bytes) -> str:
    tx_type = Transaction.detect_type(raw_tx)

    match tx_type:
        case TransactionType.LEGACY:
            return "Legacy transaction (pre-EIP-1559)"
        case TransactionType.EIP2930:
            return "Access list transaction"
        case TransactionType.EIP1559:
            return "Fee market transaction"
        case TransactionType.EIP4844:
            return "Blob transaction (data availability)"
        case TransactionType.EIP7702:
            return "Set code transaction (account abstraction)"
```

### Predicting Contract Addresses

```python
from voltaire import Transaction, Address

def predict_next_contract_address(deployer: Address, current_nonce: int) -> Address:
    """Predict where the next deployed contract will live."""
    return Transaction.calculate_create_address(deployer, current_nonce)

# Find first N contract addresses for a deployer
def get_contract_addresses(deployer: Address, count: int) -> list[Address]:
    return [
        Transaction.calculate_create_address(deployer, nonce)
        for nonce in range(count)
    ]
```

### CREATE2 Factory Pattern

```python
from voltaire import Transaction, Address

class Create2Factory:
    def __init__(self, factory_address: str):
        self.factory = Address.from_hex(factory_address)

    def predict_address(self, salt: bytes, init_code: bytes) -> Address:
        """Predict deployment address before deploying."""
        return Transaction.calculate_create2_address(
            self.factory, salt, init_code
        )

    def predict_with_constructor_args(
        self,
        salt: bytes,
        bytecode: bytes,
        constructor_args: bytes
    ) -> Address:
        """Predict address including constructor arguments."""
        init_code = bytecode + constructor_args
        return self.predict_address(salt, init_code)
```
