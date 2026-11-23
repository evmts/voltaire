# ABI Encoding and Decoding

Pure-Rust implementation of the Ethereum Contract ABI specification in `voltaire::abi` (re-exported from `voltaire::primitives::abi`).

## Calldata Layout

```mermaid
flowchart LR
    Sig["Signature string\n\"transfer(address,uint256)\""] -->|"function_selector"| Sel["Selector (4 bytes)\n0xa9059cbb"]
    Vals["types + AbiValue[]"] -->|"encode_parameters"| HeadTail["32-byte Head Words\n+ Dynamic Tail Data"]
    Sel --> Call["Calldata\n(encode_function)"]
    HeadTail --> Call
    Call -->|"decode_function_input"| Out["(Selector, Vec<AbiValue>)"]
```

## Selectors, Topics, and Signature Parsing

```rust
use voltaire::abi::{function_selector, event_topic, parse_signature, AbiType};

// 4-byte function selector
let sel = function_selector("transfer(address,uint256)");
assert_eq!(sel, [0xa9, 0x05, 0x9c, 0xbb]);

// 32-byte event topic0
let topic = event_topic("Transfer(address,address,uint256)");
assert_eq!(
    topic.to_hex(),
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
);

// Parse function name and parameter types (supports nested tuples and arrays)
let (name, types) = parse_signature("transfer(address,uint256)")?;
assert_eq!(name, "transfer");
assert_eq!(types, vec![AbiType::Address, AbiType::Uint256]);
# Ok::<(), voltaire::Error>(())
```

## Encoding and Decoding Parameters and Calldata

```rust
use voltaire::abi::{
    AbiType, AbiValue,
    encode_parameters, encode_function,
    decode_parameters, decode_function_input, decode_function_output,
};
use voltaire::Address;

let types = &[AbiType::Address, AbiType::Uint256];
let recipient: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?;
let values = &[
    AbiValue::Address(recipient),
    AbiValue::from_u64(1000),
];

// Parameters only (64 bytes)
let params = encode_parameters(types, values)?;
assert_eq!(params.len(), 64);

// Selector + parameters (68 bytes)
let calldata = encode_function("transfer(address,uint256)", types, values)?;
assert_eq!(&calldata[..4], &[0xa9, 0x05, 0x9c, 0xbb]);

// Decode parameters / return data
let decoded = decode_parameters(types, &params)?;
let output = decode_function_output(types, &params)?;
assert_eq!(decoded, output);

// Decode calldata (extracts 4-byte selector + decoded arguments)
let (selector, args) = decode_function_input(types, &calldata)?;
assert_eq!(selector, [0xa9, 0x05, 0x9c, 0xbb]);
assert_eq!(args[0].as_address(), Some(&recipient));
assert_eq!(args[1].as_u256().and_then(|v| v.to_u64()), Some(1000));
# Ok::<(), voltaire::Error>(())
```

## Type System and `AbiValue` Accessors

| Solidity Type | `AbiType` | Dynamic | `AbiValue` accessor |
|---------------|-----------|---------|---------------------|
| `uint8`..`uint256` | `AbiType::Uint8`..`Uint256` / `Uint(usize)` | No | `as_u256() -> Option<U256>` |
| `int8`..`int256` | `AbiType::Int8`..`Int256` / `Int(usize)` | No | — |
| `address` | `AbiType::Address` | No | `as_address() -> Option<&Address>` |
| `bool` | `AbiType::Bool` | No | `as_bool() -> Option<bool>` |
| `bytes1`..`bytes32` | `AbiType::FixedBytes(N)` | No | `as_bytes() -> Option<&[u8]>` |
| `bytes` | `AbiType::Bytes` | Yes | `as_bytes() -> Option<&[u8]>` |
| `string` | `AbiType::String` | Yes | `as_string() -> Option<&str>` |
| `T[]` | `AbiType::Array(Box<AbiType>)` | Yes | `as_array() -> Option<&[AbiValue]>` |
| `T[N]` | `AbiType::FixedArray(Box<AbiType>, N)` | If `T` is dynamic | `as_array() -> Option<&[AbiValue]>` |
| `(T1,T2,...)` | `AbiType::Tuple(Vec<AbiType>)` | If any field is dynamic | `as_tuple() -> Option<&[AbiValue]>` |

`AbiType::parse(&str) -> Result<AbiType>` parses canonical type strings; `AbiType::canonical_name(&self) -> String` formats them; `AbiType::is_dynamic(&self) -> bool` checks head/tail placement.

## DoS Protection Limits

| Constant | Value | Purpose |
|----------|-------|---------|
| `MAX_ABI_LENGTH` | `10 * 1024 * 1024` (10 MiB) | Bounds encoded/decoded payload allocation |
| `MAX_RECURSION_DEPTH` | `64` | Bounds nested tuple and array recursion |
