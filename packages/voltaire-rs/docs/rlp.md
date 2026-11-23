# RLP (Recursive Length Prefix)

Canonical RLP encoding, decoding, and stream parsing in `voltaire::rlp` (re-exported from `voltaire::primitives::rlp`).

## Wire Format

| Item | Leading Byte | Layout |
|------|--------------|--------|
| Single byte `0x00`..`0x7f` | `byte` | `[byte]` |
| Short bytes (`0`..`55` B) | `0x80 + len` | `[prefix, data...]` (`0x80` = empty / integer `0`) |
| Long bytes (`>= 56` B) | `0xb7 + k` | `[prefix, be_len(k B), data...]` |
| Short list (`0`..`55` B payload) | `0xc0 + len` | `[prefix, items...]` (`0xc0` = empty list) |
| Long list (`>= 56` B payload) | `0xf7 + k` | `[prefix, be_len(k B), items...]` |

## Free Functions

```rust
use voltaire::rlp::{
    encode_bytes, encode_uint, encode_list, encode_item,
    decode_bytes, decode_uint, decode_list, decode_item,
    RlpItem,
};

// Bytes
let enc = encode_bytes(b"dog");
assert_eq!(enc, vec![0x83, b'd', b'o', b'g']);
let (bytes, remainder) = decode_bytes(&enc)?;
assert_eq!(bytes, b"dog");
assert!(remainder.is_empty());

// Unsigned integers (big-endian, minimal bytes, zero -> 0x80)
assert_eq!(encode_uint(0u64), vec![0x80]);
assert_eq!(encode_uint(15u64), vec![0x0f]);
let enc_1024 = encode_uint(1024u64);
assert_eq!(enc_1024, vec![0x82, 0x04, 0x00]);
let (val, _): (u64, _) = decode_uint(&enc_1024)?;
assert_eq!(val, 1024);

// Lists and arbitrary RlpItem trees
let items = vec![
    RlpItem::Bytes(b"cat".to_vec()),
    RlpItem::Bytes(b"dog".to_vec()),
];
let list_enc = encode_list(&items);
let (decoded_items, _) = decode_list(&list_enc)?;
assert_eq!(decoded_items, items);

// Decode a single item (stream = false rejects trailing bytes)
let (item, _) = decode_item(&list_enc, false)?;
assert_eq!(encode_item(&item), list_enc);
# Ok::<(), voltaire::rlp::RlpError>(())
```

## Traits: `RlpEncodable` and `RlpDecodable`

`[u8]`, `Vec<u8>`, unsigned integers (`u8`..`u128`), `Address`, `Hash`, and `U256` implement `RlpEncodable` and `RlpDecodable`:

```rust
use voltaire::{Address, Hash, U256};
use voltaire::rlp::{RlpEncodable, RlpDecodable};

let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?;
let encoded = addr.rlp_encode();
assert_eq!(Address::rlp_decode(&encoded)?, addr);

let value = U256::from(1000u64);
let enc_u256 = value.rlp_encode();
assert_eq!(U256::rlp_decode(&enc_u256)?, value);

let hash_enc = Hash::ZERO.rlp_encode();
assert_eq!(hash_enc.len(), 33); // 0xa0 + 32 zero bytes
# Ok::<(), voltaire::rlp::RlpError>(())
```

## Streaming Decoder (`RlpDecoder`)

```rust
use voltaire::rlp::{RlpDecoder, encode_bytes, encode_uint};

let mut stream = encode_bytes(b"alpha");
stream.extend(encode_uint(42u64));

let mut decoder = RlpDecoder::new(&stream);
let first = decoder.decode_bytes()?;
let second: u64 = decoder.decode_uint()?;
assert_eq!(first, b"alpha");
assert_eq!(second, 42);
assert!(decoder.is_empty());
# Ok::<(), voltaire::rlp::RlpError>(())
```

## Validation and Errors

`validate(&[u8]) -> bool` and `is_canonical(&[u8]) -> bool` check structural and canonical RLP compliance (single bytes `< 0x80` unprefixed, minimal length encodings, short form for `< 56` bytes, nesting depth `<= MAX_RLP_DEPTH` (`32`)).

| `RlpError` Variant | Condition |
|--------------------|-----------|
| `InputTooShort` | Truncated prefix or payload |
| `InputTooLong` | Value exceeds target integer width |
| `LeadingZeros` | Non-minimal length or integer leading zero |
| `NonCanonicalSize` | Long-form prefix used for `< 56` bytes or `0x81` used for `< 0x80` |
| `InvalidLength` | Decoded length mismatches expected fixed type |
| `UnexpectedInput` | Expected bytes but found list (or vice versa) |
| `InvalidRemainder` | Trailing bytes left when `stream = false` |
| `RecursionDepthExceeded` | Nested list depth exceeds `MAX_RLP_DEPTH` (`32`) |
