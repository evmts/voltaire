# Authorization

EIP-7702 authorization types for EOA code delegation.

## Authorization

Unsigned authorization tuple specifying code delegation.

```rust
use voltaire::primitives::{Authorization, Address};

// Chain-specific authorization
let auth = Authorization::new(
    1,                              // chain_id
    "0xdead...".parse()?,          // contract address
    0,                              // nonce
);

// Valid on any chain (chain_id = 0)
let auth = Authorization::for_any_chain("0xdead...".parse()?, 0);

// Query
assert!(auth.is_chain_specific());
assert!(auth.is_valid_for_chain(1));
# Ok::<(), voltaire::Error>(())
```

## SignedAuthorization

Authorization with ECDSA signature.

```rust
use voltaire::primitives::{SignedAuthorization, Authorization, Address};

let auth = Authorization::new(1, "0xdead...".parse()?, 0);

// From components
let signed = SignedAuthorization::new(
    auth,
    0,              // y_parity (0 or 1)
    [1u8; 32],      // r
    [1u8; 32],      // s
);

// From 65-byte signature
let sig = [0u8; 65];
let signed = SignedAuthorization::from_parts(auth, &sig);

// Query
assert_eq!(signed.chain_id(), 1);
assert_eq!(signed.recovery_id(), 0);
assert_eq!(signed.v(), 27);           // Legacy v value

// Get signature bytes (r || s || y_parity)
let bytes = signed.signature_bytes();
# Ok::<(), voltaire::Error>(())
```

## AuthorizationList

Collection of signed authorizations for EIP-7702 transactions.

```rust
use voltaire::primitives::{AuthorizationList, SignedAuthorization, Authorization, Address};

let auth = Authorization::new(1, "0xdead...".parse()?, 0);
let signed = SignedAuthorization::new(auth, 0, [1u8; 32], [1u8; 32]);

let mut list = AuthorizationList::empty();
list.push(signed);

// Query
assert!(!list.is_empty());
assert!(list.targets_address(&"0xdead...".parse()?));

// Filter by chain
let mainnet: Vec<_> = list.filter_for_chain(1).collect();

// Gas cost (25000 per authorization)
assert_eq!(list.gas_cost(), 25_000);
# Ok::<(), voltaire::Error>(())
```

## Validation

```rust
use voltaire::primitives::{SignedAuthorization, Authorization, Address};

let auth = Authorization::new(1, "0xdead...".parse()?, 0);
let signed = SignedAuthorization::new(auth, 0, [1u8; 32], [1u8; 32]);

// Validates:
// - address is non-zero
// - y_parity is 0 or 1
// - r and s are non-zero
// - s is in lower half of curve order (EIP-2)
signed.validate()?;
# Ok::<(), voltaire::Error>(())
```

## Signer Recovery (native feature)

```rust,ignore
use voltaire::primitives::{SignedAuthorization, Authorization, Address};

let signed = /* ... */;

// Recover signer from signature
let signer = signed.recover_signer()?;

// Verify against expected signer
assert!(signed.verify_signer(&expected_address)?);
```

## Gas Calculation

Per EIP-7702: 25,000 gas per authorization.

```rust
use voltaire::primitives::{AuthorizationList, SignedAuthorization, Authorization, Address};

let auth = Authorization::new(1, "0xdead...".parse()?, 0);
let signed = SignedAuthorization::new(auth, 0, [1u8; 32], [1u8; 32]);

let list = AuthorizationList::new(vec![signed, signed]);
assert_eq!(list.gas_cost(), 50_000);
# Ok::<(), voltaire::Error>(())
```
