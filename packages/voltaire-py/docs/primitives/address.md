# Address

20-byte Ethereum address with EIP-55 checksum support.

## Overview

The `Address` class represents an Ethereum address - a 20-byte (160-bit) identifier derived from the last 20 bytes of the Keccak-256 hash of a public key. It provides:

- Parsing from hex strings (with or without `0x` prefix)
- EIP-55 mixed-case checksum encoding
- Comparison and equality operations
- Conversion to/from bytes
- Zero address utilities

## API Reference

### Constructors

#### `Address.from_hex(hex_str: str) -> Address`

Create an address from a hex string.

```python
from voltaire import Address

# With 0x prefix
addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")

# Without prefix (also valid)
addr = Address.from_hex("742d35Cc6634C0532925a3b844Bc9e7595f2bD20")

# Case insensitive
addr = Address.from_hex("0x742D35CC6634C0532925A3B844BC9E7595F2BD20")
```

**Raises:**
- `InvalidHexError` - Invalid hex characters
- `InvalidLengthError` - Not exactly 20 bytes (40 hex chars)

#### `Address.from_bytes(data: bytes) -> Address`

Create an address from raw bytes.

```python
addr = Address.from_bytes(b'\x74\x2d\x35...')  # 20 bytes
```

**Raises:**
- `InvalidLengthError` - Not exactly 20 bytes

#### `Address.zero() -> Address`

Create the zero address (20 null bytes).

```python
zero = Address.zero()
assert zero.is_zero()
assert zero.to_hex() == "0x0000000000000000000000000000000000000000"
```

### Instance Methods

#### `to_hex() -> str`

Return lowercase hex string with `0x` prefix.

```python
addr = Address.from_hex("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e")
print(addr.to_hex())  # "0xa0cf798816d4b9b9866b5330eea46a18382f251e"
```

#### `to_checksum() -> str`

Return EIP-55 checksummed hex string.

```python
addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
print(addr.to_checksum())  # "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"
```

#### `to_bytes() -> bytes`

Return raw 20-byte representation.

```python
addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
raw = addr.to_bytes()
assert len(raw) == 20
```

#### `is_zero() -> bool`

Check if this is the zero address.

```python
assert Address.zero().is_zero()
assert not Address.from_hex("0x742d...").is_zero()
```

### Class Methods

#### `Address.calculate_create_address(sender: Address, nonce: int) -> Address`

Calculate the contract address for a CREATE opcode deployment.

The CREATE address is derived from: `keccak256(rlp([sender, nonce]))[12:]`

```python
from voltaire import Address

# Calculate where a contract will be deployed
deployer = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")

# First deployment (nonce 0)
contract_addr = Address.calculate_create_address(deployer, 0)
print(contract_addr.to_checksum())  # 0xCd234a471b72ba2f1ccf0a70fcaba648a5Eecd8D

# Second deployment (nonce 1)
contract_addr_2 = Address.calculate_create_address(deployer, 1)
print(contract_addr_2.to_checksum())  # 0x343C43A37d37Dff08aE8c4a11544c718ABb4FcF8
```

**Args:**
- `sender` - The deployer address
- `nonce` - The transaction nonce (must be non-negative)

**Returns:**
- The contract address that will be created

**Raises:**
- `InvalidValueError` - If nonce is negative

#### `Address.calculate_create2_address(sender: Address, salt: bytes, init_code: bytes) -> Address`

Calculate the deterministic contract address for a CREATE2 opcode deployment.

The CREATE2 address is derived from: `keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]`

```python
from voltaire import Address

# Factory contract address
factory = Address.from_hex("0x0000000000000000000000000000000000000000")

# 32-byte salt
salt = bytes(32)  # All zeros

# Contract initialization code
init_code = bytes.fromhex("608060405234801561001057600080fd5b50")

# Calculate deterministic address
contract_addr = Address.calculate_create2_address(factory, salt, init_code)
print(contract_addr.to_checksum())
```

**Args:**
- `sender` - The factory contract address
- `salt` - Exactly 32 bytes of salt
- `init_code` - The contract initialization bytecode

**Returns:**
- The deterministic contract address

**Raises:**
- `InvalidLengthError` - If salt is not exactly 32 bytes

### Static Methods

#### `Address.validate_checksum(hex_str: str) -> bool`

Validate that a hex string has correct EIP-55 checksum.

```python
# Valid checksum
assert Address.validate_checksum("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e")

# Invalid (all lowercase)
assert not Address.validate_checksum("0xa0cf798816d4b9b9866b5330eea46a18382f251e")

# Invalid (all uppercase)
assert not Address.validate_checksum("0xA0CF798816D4B9B9866B5330EEA46A18382F251E")
```

### Python Protocol Support

#### Equality (`==`)

```python
addr1 = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
addr2 = Address.from_hex("0x742d35cc6634c0532925a3b844bc9e7595f2bd20")
assert addr1 == addr2  # Case insensitive comparison
```

#### Hashing

Addresses are hashable and can be used in sets and as dict keys.

```python
addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
address_set = {addr}
address_dict = {addr: "my_wallet"}
```

#### `bytes()` conversion

```python
addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
raw = bytes(addr)  # Same as addr.to_bytes()
```

#### String representation

```python
addr = Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20")
print(repr(addr))  # Address('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20')
print(str(addr))   # 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD20
```

## EIP-55 Checksum

EIP-55 defines a mixed-case checksum encoding for Ethereum addresses:

1. Convert address to lowercase hex (without `0x`)
2. Take Keccak-256 hash of the lowercase hex string
3. For each character in the address:
   - If it's a letter (a-f) and the corresponding nibble in the hash >= 8, uppercase it
   - Otherwise, keep it lowercase

This provides error detection without changing the address format.

```python
# Example transformation:
# Input:  0xa0cf798816d4b9b9866b5330eea46a18382f251e
# Output: 0xA0Cf798816D4b9b9866b5330EEa46a18382f251e
#           ^  ^                  ^^
#           These letters are uppercased based on hash
```

## Examples

### Basic Usage

```python
from voltaire import Address

# Parse and normalize
addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")

# Get checksummed format for display
print(f"Address: {addr.to_checksum()}")

# Check if zero
if addr.is_zero():
    print("This is the null address")
```

### Working with Collections

```python
from voltaire import Address

# Deduplicate addresses (case-insensitive)
addresses = [
    Address.from_hex("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"),
    Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e"),  # Same address
    Address.from_hex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
]
unique = list(set(addresses))  # Will have 2 addresses
```

### Validating User Input

```python
from voltaire import Address, InvalidHexError, InvalidLengthError

def parse_address(user_input: str) -> Address | None:
    try:
        addr = Address.from_hex(user_input)
        # Optionally validate checksum if mixed-case
        if any(c.isupper() for c in user_input[2:]):
            if not Address.validate_checksum(user_input):
                print("Warning: Invalid checksum")
        return addr
    except (InvalidHexError, InvalidLengthError) as e:
        print(f"Invalid address: {e}")
        return None
```

### Contract Address Calculation

```python
from voltaire import Address

# Predict CREATE address before deployment
deployer = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
nonce = 0

contract_addr = Address.calculate_create_address(deployer, nonce)
print(f"Contract will deploy to: {contract_addr.to_checksum()}")

# Predict CREATE2 address (deterministic deployment)
factory = Address.from_hex("0x0000000000000000000000000000000000000000")
salt = bytes(32)
init_code = b""

deterministic_addr = Address.calculate_create2_address(factory, salt, init_code)
print(f"Deterministic address: {deterministic_addr.to_checksum()}")
```
