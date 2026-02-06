# RLP (Recursive Length Prefix)

Ethereum's serialization format for encoding arbitrary data.

## Overview

RLP encodes arbitrarily nested arrays of binary data. It's used throughout Ethereum for:
- Transaction serialization
- Block encoding
- State storage
- Network messages

## Encoding Rules

### Strings (bytes)
- Single byte [0x00, 0x7f]: Encoded as itself
- String 0-55 bytes: 0x80 + length prefix, then data
- String >55 bytes: 0xb7 + length-of-length, then length, then data

### Lists
- List 0-55 bytes total: 0xc0 + length prefix, then items
- List >55 bytes total: 0xf7 + length-of-length, then length, then items

## Basic Usage

```rust
use voltaire::rlp::{encode, decode, RlpEncodable, RlpDecodable};

// Encode bytes
let encoded = encode(&b"dog"[..]);
assert_eq!(encoded, vec![0x83, b'd', b'o', b'g']);

// Decode bytes
let decoded: Vec<u8> = decode(&encoded)?;
assert_eq!(decoded, b"dog");

// Encode empty string
let encoded = encode(&[][..]);
assert_eq!(encoded, vec![0x80]);

// Encode single byte < 0x80
let encoded = encode(&[0x7f][..]);
assert_eq!(encoded, vec![0x7f]);
```

## Integer Encoding

Integers are encoded as big-endian bytes with no leading zeros.

```rust
use voltaire::rlp::encode_uint;

// Zero encodes as empty string
let encoded = encode_uint(0u64);
assert_eq!(encoded, vec![0x80]);

// Single byte < 0x80
let encoded = encode_uint(15u64);
assert_eq!(encoded, vec![0x0f]);

// Multi-byte integer
let encoded = encode_uint(1024u64);
assert_eq!(encoded, vec![0x82, 0x04, 0x00]);

// Large integer
let encoded = encode_uint(0xFFFFFFFF_FFFFFFFFu64);
assert_eq!(encoded.len(), 9); // prefix + 8 bytes
```

## List Encoding

```rust
use voltaire::rlp::{encode_list, RlpItem};

// Encode list of strings
let items = vec![
    RlpItem::Bytes(b"cat".to_vec()),
    RlpItem::Bytes(b"dog".to_vec()),
];
let encoded = encode_list(&items);

// Empty list
let encoded = encode_list(&[]);
assert_eq!(encoded, vec![0xc0]);

// Nested lists
let inner = RlpItem::List(vec![
    RlpItem::Bytes(vec![1]),
    RlpItem::Bytes(vec![2]),
]);
let outer = encode_list(&[inner]);
```

## Decoding

```rust
use voltaire::rlp::{decode_bytes, decode_list, decode_uint, RlpItem};

// Decode bytes
let data = vec![0x83, b'd', b'o', b'g'];
let (bytes, remainder) = decode_bytes(&data)?;
assert_eq!(bytes, b"dog");

// Decode list
let data = vec![0xc8, 0x83, b'c', b'a', b't', 0x83, b'd', b'o', b'g'];
let (items, _) = decode_list(&data)?;

// Decode integer
let data = vec![0x82, 0x04, 0x00];
let (value, _): (u64, _) = decode_uint(&data)?;
assert_eq!(value, 1024);
```

## Primitives Integration

Address, Hash, and U256 implement RlpEncodable and RlpDecodable.

```rust
use voltaire::{Address, Hash, U256};
use voltaire::rlp::{encode, decode};

// Encode address (20 bytes with length prefix)
let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?;
let encoded = addr.rlp_encode();

// Decode address
let decoded: Address = Address::rlp_decode(&encoded)?;

// Encode U256 (minimal bytes, no leading zeros)
let value = U256::from(1000u64);
let encoded = value.rlp_encode();

// Hash encodes as 32 bytes
let hash = Hash::ZERO;
let encoded = hash.rlp_encode();
assert_eq!(encoded.len(), 33); // 0xa0 + 32 bytes
```

## Stream Decoding

Process multiple consecutive RLP items.

```rust
use voltaire::rlp::RlpDecoder;

let stream = concatenated_rlp_data;
let mut decoder = RlpDecoder::new(&stream);

while !decoder.is_empty() {
    let item = decoder.decode_item()?;
    // Process item...
}
```

## Validation

```rust
use voltaire::rlp::{validate, is_canonical};

// Check if data is valid RLP
let is_valid = validate(&data);

// Check canonical encoding (EIP-compliant)
let is_canonical = is_canonical(&data);
```

## Error Handling

```rust
use voltaire::rlp::RlpError;

match decode::<Vec<u8>>(&data) {
    Ok(bytes) => println!("Decoded: {:?}", bytes),
    Err(RlpError::InputTooShort) => println!("Truncated input"),
    Err(RlpError::NonCanonicalSize) => println!("Non-canonical encoding"),
    Err(RlpError::LeadingZeros) => println!("Invalid leading zeros"),
    Err(e) => println!("Error: {}", e),
}
```

## Canonical Encoding

Voltaire enforces canonical RLP encoding:
- Single bytes < 0x80 must not have 0x81 prefix
- Lengths must use minimum bytes (no leading zeros)
- Strings < 56 bytes must use short form
- Lists < 56 bytes must use short form

Non-canonical data will be rejected during decoding.
