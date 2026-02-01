# Authorization

EIP-7702 authorization tuple for account abstraction.

## Overview

The `Authorization` class represents an EIP-7702 authorization tuple that allows externally owned accounts (EOAs) to temporarily delegate execution to contract code. This enables EOAs to behave like smart contract wallets without deploying a new contract.

Key features:
- Immutable, hashable dataclass
- Validation of chain ID, address, nonce, and signature parameters
- Signing hash computation for authorization creation
- Authority (signer) recovery from signed authorizations
- Gas cost calculation for authorization lists

## API Reference

### Class: `Authorization`

```python
@dataclass(frozen=True, slots=True)
class Authorization:
    chain_id: int        # Target chain ID (0 for cross-chain)
    address: bytes       # 20-byte contract address to delegate to
    nonce: int           # Signer's nonce at signing time
    y_parity: int        # Signature recovery parameter (0 or 1)
    r: bytes             # 32-byte signature r component
    s: bytes             # 32-byte signature s component
```

### Constructors

#### `Authorization(...)`

Create an authorization directly.

```python
from voltaire import Authorization

auth = Authorization(
    chain_id=1,
    address=bytes.fromhex("1111111111111111111111111111111111111111"),
    nonce=0,
    y_parity=0,
    r=bytes.fromhex("..."),  # 32 bytes
    s=bytes.fromhex("..."),  # 32 bytes
)
```

#### `Authorization.from_dict(d: dict) -> Authorization`

Create from a dictionary (useful for JSON deserialization).

```python
auth = Authorization.from_dict({
    "chainId": 1,
    "address": "0x1111111111111111111111111111111111111111",
    "nonce": 0,
    "yParity": 0,
    "r": "0x...",
    "s": "0x...",
})
```

### Instance Methods

#### `validate() -> bool`

Validate authorization parameters. Checks:
- Chain ID is valid
- Address is not zero address
- y_parity is 0 or 1
- Signature r is non-zero and less than curve order
- Signature s is non-zero and not malleable (s <= N/2)

```python
auth = Authorization(...)
if auth.validate():
    print("Authorization is valid")
```

**Raises:**
- `InvalidAuthorizationError` - If validation fails

#### `signing_hash() -> bytes`

Compute the EIP-7702 signing hash for this authorization.

```python
auth = Authorization(chain_id=1, address=target, nonce=0, ...)
hash_bytes = auth.signing_hash()  # 32-byte Keccak-256 hash
```

The signing hash is computed as:
```
keccak256(0x05 || rlp([chain_id, address, nonce]))
```

Where `0x05` is the EIP-7702 magic byte.

#### `recover_authority() -> bytes`

Recover the signer's address from the authorization signature.

```python
auth = Authorization(...)
signer = auth.recover_authority()  # 20-byte address
```

**Raises:**
- `InvalidSignatureError` - If signature recovery fails

#### `to_dict() -> dict`

Convert to a dictionary (useful for JSON serialization).

```python
auth = Authorization(...)
d = auth.to_dict()
# {
#     "chainId": 1,
#     "address": "0x1111...",
#     "nonce": 0,
#     "yParity": 0,
#     "r": "0x...",
#     "s": "0x...",
# }
```

### Static Methods

#### `Authorization.gas_cost(auth_count: int, empty_accounts: int = 0) -> int`

Calculate gas cost for an authorization list.

```python
# 2 authorizations, 1 targeting empty account
cost = Authorization.gas_cost(auth_count=2, empty_accounts=1)
# cost = 2 * 12500 + 1 * 25000 = 50000
```

Gas formula:
- `PER_AUTH_BASE_COST` = 12,500 gas per authorization
- `PER_EMPTY_ACCOUNT_COST` = 25,000 gas per empty account target

### Constants

```python
from voltaire.authorization import (
    MAGIC_BYTE,              # 0x05 - EIP-7702 signing prefix
    PER_AUTH_BASE_COST,      # 12500 gas
    PER_EMPTY_ACCOUNT_COST,  # 25000 gas
    SECP256K1_N,             # Curve order
    SECP256K1_HALF_N,        # N/2 for malleability check
)
```

## EIP-7702 Background

EIP-7702 (introduced in the Pectra upgrade) allows EOAs to set code on their account for the duration of a single transaction. This is done via an authorization tuple that:

1. Specifies a contract address to delegate to
2. Is signed by the EOA's private key
3. Includes chain ID and nonce for replay protection

When included in a transaction, the EVM temporarily "installs" the target contract's code on the EOA, allowing it to execute smart contract logic.

### Use Cases

- **Account Abstraction**: Enable EOAs to use smart wallet features (batching, gas sponsorship, social recovery)
- **Temporary Delegation**: Allow trusted contracts to act on behalf of an EOA
- **Gas Optimization**: Batch multiple operations into a single transaction

## Examples

### Basic Validation

```python
from voltaire import Authorization, InvalidAuthorizationError

auth = Authorization(
    chain_id=1,
    address=bytes.fromhex("1111111111111111111111111111111111111111"),
    nonce=0,
    y_parity=0,
    r=bytes(32),  # Invalid: zero r
    s=bytes.fromhex("0000000000000000000000000000000000000000000000000000000000000001"),
)

try:
    auth.validate()
except InvalidAuthorizationError as e:
    print(f"Invalid: {e}")
```

### Recovering Signer

```python
from voltaire import Authorization

# Assuming auth was created and signed properly
auth = Authorization.from_dict(signed_auth_dict)
signer_address = auth.recover_authority()
print(f"Signed by: 0x{signer_address.hex()}")
```

### Gas Estimation

```python
from voltaire import Authorization

# Estimate gas for EIP-7702 transaction
num_authorizations = 3
num_empty_targets = 1

gas = Authorization.gas_cost(num_authorizations, num_empty_targets)
print(f"Authorization gas cost: {gas}")  # 62500 gas
```

### JSON Serialization

```python
import json
from voltaire import Authorization

# Deserialize
auth_json = '{"chainId": 1, "address": "0x1111...", ...}'
auth = Authorization.from_dict(json.loads(auth_json))

# Serialize
output = json.dumps(auth.to_dict())
```
