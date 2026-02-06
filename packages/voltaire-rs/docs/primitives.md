# Primitives

Core Ethereum data types with idiomatic Rust APIs.

## Address

20-byte Ethereum address with EIP-55 checksum support.

```rust
use voltaire::Address;

// Parse from hex (case-insensitive)
let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?;

// From bytes
let addr = Address::from_slice(&bytes)?;
let addr = Address::new([0u8; 20]);

// Display
println!("{}", addr);           // Checksummed
println!("{:x}", addr);         // Lowercase

// Comparisons
assert!(!addr.is_zero());
assert!(addr.ct_eq(&other));    // Constant-time

// Derive from public key
let addr = Address::from_public_key(&pubkey)?;

// CREATE address
let contract = Address::create_address(&sender, nonce)?;

// CREATE2 address
let contract = Address::create2_address(&sender, &salt, &init_code_hash);
```

## Hash

32-byte hash value for Keccak-256 outputs, storage keys, etc.

```rust
use voltaire::Hash;

// From hex
let hash: Hash = "0x...".parse()?;

// From bytes
let hash = Hash::from_slice(&bytes)?;

// Constant-time equality
assert!(hash.ct_eq(&other));
```

## U256

256-bit unsigned integer in big-endian format.

```rust
use voltaire::U256;

// From integers
let value = U256::from(1000u64);
let value = U256::from(1_000_000_000_000_000_000u128);

// From hex
let value: U256 = "0x3e8".parse()?;

// Arithmetic
let sum = a.checked_add(b)?;
let diff = a.checked_sub(b)?;

// To integers (if fits)
let n: Option<u64> = value.to_u64();

// Display
println!("{}", value);          // Minimal hex (0x3e8)
println!("{:x}", value);        // Full hex
```

## Hex

Hexadecimal encoding/decoding utilities.

```rust
use voltaire::Hex;

// Decode
let bytes = Hex::decode("0xdeadbeef")?;
let bytes: [u8; 4] = Hex::decode_fixed("0xdeadbeef")?;

// Encode
let hex = Hex::encode(&bytes);      // "0xdeadbeef"
let hex = Hex::encode_raw(&bytes);  // "deadbeef"

// Validate
assert!(Hex::is_valid("0xabc"));
```
