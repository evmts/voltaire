# ABI Encoding/Decoding

Ethereum Contract ABI specification implementation for encoding function calls, decoding return data, and computing selectors.

## Function Selectors

Compute 4-byte function selectors from signatures:

```rust
use voltaire::abi::function_selector;

let selector = function_selector("transfer(address,uint256)");
assert_eq!(selector, [0xa9, 0x05, 0x9c, 0xbb]);

let selector = function_selector("balanceOf(address)");
assert_eq!(selector, [0x70, 0xa0, 0x82, 0x31]);

let selector = function_selector("approve(address,uint256)");
assert_eq!(selector, [0x09, 0x5e, 0xa7, 0xb3]);
```

## Event Topics

Compute 32-byte event topics:

```rust
use voltaire::abi::event_topic;

let topic = event_topic("Transfer(address,address,uint256)");
assert_eq!(
    topic.to_hex(),
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
);
```

## Type Parsing

Parse ABI types from canonical strings:

```rust
use voltaire::abi::AbiType;

let t = AbiType::parse("uint256")?;
let t = AbiType::parse("address")?;
let t = AbiType::parse("bool")?;
let t = AbiType::parse("bytes32")?;
let t = AbiType::parse("string")?;

// Arrays
let t = AbiType::parse("uint256[]")?;        // Dynamic array
let t = AbiType::parse("address[5]")?;       // Fixed array

// Tuples
let t = AbiType::parse("(address,uint256)")?;
```

## Encoding Parameters

Encode values for contract calls:

```rust
use voltaire::abi::{AbiType, AbiValue, encode_parameters};
use voltaire::Address;

let types = &[AbiType::Address, AbiType::Uint256];
let values = &[
    AbiValue::Address("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?),
    AbiValue::from_u64(1000),
];

let encoded = encode_parameters(types, values)?;
assert_eq!(encoded.len(), 64); // 2 * 32 bytes
```

## Encoding Function Calls

Encode complete calldata (selector + parameters):

```rust
use voltaire::abi::{AbiType, AbiValue, encode_function};
use voltaire::Address;

let types = &[AbiType::Address, AbiType::Uint256];
let values = &[
    AbiValue::Address("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?),
    AbiValue::from_u64(1000),
];

let calldata = encode_function("transfer(address,uint256)", types, values)?;
assert_eq!(&calldata[..4], &[0xa9, 0x05, 0x9c, 0xbb]); // selector
assert_eq!(calldata.len(), 68); // 4 + 64
```

## Decoding Parameters

Decode ABI-encoded data:

```rust
use voltaire::abi::{AbiType, decode_parameters};

let types = &[AbiType::Address, AbiType::Uint256];
let data = hex::decode(
    "000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045\
     0000000000000000000000000000000000000000000000000000000000000001"
)?;

let values = decode_parameters(types, &data)?;
let addr = values[0].as_address().unwrap();
let amount = values[1].as_u256().unwrap();
```

## Decoding Function Input

Decode calldata with selector:

```rust
use voltaire::abi::{AbiType, decode_function_input};

let calldata = hex::decode(
    "a9059cbb\
     000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045\
     00000000000000000000000000000000000000000000000000000000000003e8"
)?;

let types = &[AbiType::Address, AbiType::Uint256];
let (selector, values) = decode_function_input(types, &calldata)?;

assert_eq!(selector, [0xa9, 0x05, 0x9c, 0xbb]); // transfer
assert_eq!(values[1].as_u256().unwrap().to_u64(), Some(1000));
```

## Supported Types

| Type | Rust Type | Description |
|------|-----------|-------------|
| `uint8`-`uint256` | `u8`-`u128`, `[u8; 32]` | Unsigned integers |
| `int8`-`int256` | `i8`-`i128`, `[u8; 32]` | Signed integers |
| `address` | `Address` | 20-byte address |
| `bool` | `bool` | Boolean |
| `bytes1`-`bytes32` | `[u8; N]` | Fixed bytes |
| `bytes` | `Vec<u8>` | Dynamic bytes |
| `string` | `String` | UTF-8 string |
| `T[]` | `Vec<AbiValue>` | Dynamic array |
| `T[N]` | `Vec<AbiValue>` | Fixed array |
| `(T1,T2,...)` | `Vec<AbiValue>` | Tuple |

## AbiValue Helpers

```rust
use voltaire::abi::AbiValue;
use voltaire::{Address, U256};

// Create values
let uint = AbiValue::from_u64(1000);
let uint = AbiValue::from_u256(U256::from(1000u64));
let addr = AbiValue::Address("0x...".parse()?);
let flag = AbiValue::Bool(true);
let text = AbiValue::String("hello".to_string());
let data = AbiValue::Bytes(vec![1, 2, 3]);

// Extract values
let n: Option<U256> = uint.as_u256();
let a: Option<&Address> = addr.as_address();
let b: Option<bool> = flag.as_bool();
let s: Option<&str> = text.as_string();
let d: Option<&[u8]> = data.as_bytes();
```

## Security Limits

- Maximum encoding size: 10 MB
- Maximum recursion depth: 64 levels

These limits prevent DoS attacks from malicious input.

## Parse Signature

Extract function name and types from signature:

```rust
use voltaire::abi::{parse_signature, AbiType};

let (name, types) = parse_signature("transfer(address,uint256)")?;
assert_eq!(name, "transfer");
assert_eq!(types, vec![AbiType::Address, AbiType::Uint256]);

let (name, types) = parse_signature("complexFn(uint256,(address,bool),bytes)")?;
// Handles nested tuples
```

## Canonical Type Names

Get canonical string representation:

```rust
use voltaire::abi::AbiType;

assert_eq!(AbiType::Uint256.canonical_name(), "uint256");
assert_eq!(
    AbiType::Array(Box::new(AbiType::Address)).canonical_name(),
    "address[]"
);
assert_eq!(
    AbiType::Tuple(vec![AbiType::Address, AbiType::Uint256]).canonical_name(),
    "(address,uint256)"
);
```
