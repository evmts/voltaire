# RLP (Recursive Length Prefix)

Ethereum's canonical serialization format for encoding arbitrary nested arrays of binary data.

## Overview

RLP (Recursive Length Prefix) is the primary encoding method for serializing objects in Ethereum. It's designed to encode arbitrarily nested arrays of binary data with a compact, deterministic representation.

**Key Properties:**
- Deterministic - same input always produces same output
- Space-efficient - minimal overhead for encoding
- Simple - only encodes structure, not types
- Fast - optimized for performance-critical operations

**Common Uses:**
- Transaction encoding for signing and broadcast
- Block and block header serialization
- State trie node encoding
- Network protocol message encoding

## Quick Start

```typescript
import { Rlp } from '@tevm/primitives';

// Encode bytes
const data = new Uint8Array([1, 2, 3]);
const encoded = Rlp.encode.call(data);

// Encode list
const list = [
  new Uint8Array([0x01]),
  new Uint8Array([0x02])
];
const encodedList = Rlp.encode.call(list);

// Decode
const decoded = Rlp.decode.call(encoded);
console.log(decoded.data); // { type: 'bytes', value: Uint8Array([1, 2, 3]) }
```

## RLP Encoding Rules

### Single Bytes (0x00-0x7f)

Bytes with values less than 0x80 encode as themselves (no prefix).

```typescript
const input = new Uint8Array([0x7f]);
const encoded = Rlp.encode.call(input);
// Result: Uint8Array([0x7f])
```

### Short Strings (0-55 bytes)

Strings of 0-55 bytes: `[0x80 + length, ...bytes]`

```typescript
const input = new Uint8Array([1, 2, 3]); // 3 bytes
const encoded = Rlp.encode.call(input);
// Result: Uint8Array([0x83, 1, 2, 3])
// 0x83 = 0x80 + 3
```

### Long Strings (56+ bytes)

Strings of 56+ bytes: `[0xb7 + length_of_length, ...length_bytes, ...bytes]`

```typescript
const input = new Uint8Array(60).fill(0x42); // 60 bytes
const encoded = Rlp.encode.call(input);
// Result: Uint8Array([0xb8, 60, ...bytes])
// 0xb8 = 0xb7 + 1 (length needs 1 byte)
// 60 = length value
```

### Short Lists (0-55 bytes total)

Lists with total payload < 56 bytes: `[0xc0 + length, ...encoded_items]`

```typescript
const list = [new Uint8Array([0x01]), new Uint8Array([0x02])];
const encoded = Rlp.encode.call(list);
// Result: Uint8Array([0xc4, 0x01, 0x02])
// 0xc4 = 0xc0 + 4 (total of 2 items + 2 bytes)
```

### Long Lists (56+ bytes total)

Lists with total payload >= 56 bytes: `[0xf7 + length_of_length, ...length_bytes, ...encoded_items]`

```typescript
const longList = Array.from({ length: 60 }, () => new Uint8Array([0x01]));
const encoded = Rlp.encode.call(longList);
// First byte will be 0xf8 or higher
```

## Core Types

### Rlp.Data

Discriminated union representing decoded RLP data.

```typescript
type Data =
  | { type: "bytes"; value: Uint8Array }
  | { type: "list"; value: Data[] };
```

### Rlp.Decoded

Result of decoding operation with remainder for stream decoding.

```typescript
type Decoded = {
  data: Data;
  remainder: Uint8Array;
};
```

### Rlp.Encodable

Types that can be RLP-encoded.

```typescript
type Encodable = Uint8Array | Data | Encodable[];
```

## Type Guards

### isData

Check if value is valid RLP Data structure.

```typescript
Rlp.isData(value: unknown): value is Rlp.Data
```

```typescript
const data = { type: "bytes", value: new Uint8Array([1]) };
if (Rlp.isData(data)) {
  console.log('Valid RLP Data');
}
```

### isBytesData

Check if value is bytes Data.

```typescript
Rlp.isBytesData(value: unknown): value is Data & { type: "bytes" }
```

### isListData

Check if value is list Data.

```typescript
Rlp.isListData(value: unknown): value is Data & { type: "list" }
```

## Encoding Operations

### encode

Main encoding function supporting all encodable types (this: pattern).

```typescript
Rlp.encode.call(data: Encodable): Uint8Array
```

```typescript
// Encode bytes
const bytes = new Uint8Array([1, 2, 3]);
const encoded = Rlp.encode.call(bytes);

// Encode list
const list = [new Uint8Array([1]), new Uint8Array([2])];
const encoded = Rlp.encode.call(list);

// Encode nested structure
const nested = [
  new Uint8Array([1]),
  [new Uint8Array([2]), new Uint8Array([3])]
];
const encoded = Rlp.encode.call(nested);

// Encode Data structure
const data: Rlp.Data = {
  type: "bytes",
  value: new Uint8Array([1, 2, 3])
};
const encoded = Rlp.encode.call(data);
```

### encodeBytes

Encode byte array according to RLP string rules (this: pattern).

```typescript
Rlp.encodeBytes.call(bytes: Uint8Array): Uint8Array
```

```typescript
// Single byte < 0x80
const b1 = new Uint8Array([0x7f]);
const encoded = Rlp.encodeBytes.call(b1);
// => Uint8Array([0x7f])

// Short string
const b2 = new Uint8Array([1, 2, 3]);
const encoded = Rlp.encodeBytes.call(b2);
// => Uint8Array([0x83, 1, 2, 3])

// Long string
const longBytes = new Uint8Array(60).fill(0x42);
const encoded = Rlp.encodeBytes.call(longBytes);
// => Uint8Array([0xb8, 60, ...bytes])
```

### encodeList

Encode list of RLP-encodable items (this: pattern).

```typescript
Rlp.encodeList.call(items: Encodable[]): Uint8Array
```

```typescript
// Empty list
const empty = [];
const encoded = Rlp.encodeList.call(empty);
// => Uint8Array([0xc0])

// Simple list
const list = [new Uint8Array([1]), new Uint8Array([2])];
const encoded = Rlp.encodeList.call(list);

// Nested list
const nested = [
  new Uint8Array([1]),
  [new Uint8Array([2])]
];
const encoded = Rlp.encodeList.call(nested);
```

## Decoding Operations

### decode

Decode RLP-encoded bytes (this: pattern).

```typescript
Rlp.decode.call(bytes: Uint8Array, stream?: boolean): Decoded
```

**Parameters:**
- `bytes` - RLP-encoded data
- `stream` - If true, allows extra data after decoded value (default: false)

```typescript
// Decode single value
const bytes = new Uint8Array([0x83, 1, 2, 3]);
const result = Rlp.decode.call(bytes);
// => {
//   data: { type: 'bytes', value: Uint8Array([1, 2, 3]) },
//   remainder: Uint8Array([])
// }

// Stream decoding (multiple values)
const stream = new Uint8Array([0x01, 0x02]);
const result = Rlp.decode.call(stream, true);
// => {
//   data: { type: 'bytes', value: Uint8Array([1]) },
//   remainder: Uint8Array([2])
// }

// Decode list
const list = new Uint8Array([0xc3, 0x01, 0x02, 0x03]);
const result = Rlp.decode.call(list);
```

**Validation:**
- Checks for leading zeros in length encoding
- Enforces canonical representation (no unnecessary long form)
- Prevents recursion depth > MAX_DEPTH (32)
- In non-stream mode, verifies no remainder after decoding

## Data Namespace

Operations for working with RLP Data structures.

### Data.fromBytes

Create bytes Data from Uint8Array (this: pattern).

```typescript
Rlp.Data.fromBytes.call(bytes: Uint8Array): Rlp.Data & { type: "bytes" }
```

```typescript
const bytes = new Uint8Array([1, 2, 3]);
const data = Rlp.Data.fromBytes.call(bytes);
// => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
```

### Data.fromList

Create list Data from array (this: pattern).

```typescript
Rlp.Data.fromList.call(items: Rlp.Data[]): Rlp.Data & { type: "list" }
```

```typescript
const items = [
  { type: 'bytes', value: new Uint8Array([1]) },
  { type: 'bytes', value: new Uint8Array([2]) }
];
const data = Rlp.Data.fromList.call(items);
```

### Data.encode

Encode Data to RLP bytes (this: pattern).

```typescript
Rlp.Data.encode.call(data: Rlp.Data): Uint8Array
```

### Data.toBytes

Extract bytes value if type is bytes (this: pattern).

```typescript
Rlp.Data.toBytes.call(data: Rlp.Data): Uint8Array | undefined
```

```typescript
const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
const bytes = Rlp.Data.toBytes.call(data);
// => Uint8Array([1, 2, 3])
```

### Data.toList

Extract list value if type is list (this: pattern).

```typescript
Rlp.Data.toList.call(data: Rlp.Data): Rlp.Data[] | undefined
```

## Utility Functions

### getEncodedLength

Calculate encoded length without actually encoding (this: pattern).

```typescript
Rlp.getEncodedLength.call(data: Encodable): number
```

```typescript
const bytes = new Uint8Array([1, 2, 3]);
const length = Rlp.getEncodedLength.call(bytes);
// => 4 (0x83 prefix + 3 bytes)

// Verify against actual encoding
const encoded = Rlp.encode.call(bytes);
console.log(length === encoded.length); // true
```

### flatten

Flatten nested list Data into array of bytes Data (this: pattern).

```typescript
Rlp.flatten.call(data: Data): Array<Data & { type: "bytes" }>
```

```typescript
const nested = {
  type: 'list',
  value: [
    { type: 'bytes', value: new Uint8Array([1]) },
    {
      type: 'list',
      value: [{ type: 'bytes', value: new Uint8Array([2]) }]
    }
  ]
};
const flat = Rlp.flatten.call(nested);
// => [
//   { type: 'bytes', value: Uint8Array([1]) },
//   { type: 'bytes', value: Uint8Array([2]) }
// ]
```

### equals

Check if two RLP Data structures are equal (this: pattern).

```typescript
Rlp.equals.call(a: Data, b: Data): boolean
```

```typescript
const a = { type: 'bytes', value: new Uint8Array([1, 2]) };
const b = { type: 'bytes', value: new Uint8Array([1, 2]) };
const equal = Rlp.equals.call(a, b); // => true
```

### toJSON

Convert RLP Data to JSON-serializable format (this: pattern).

```typescript
Rlp.toJSON.call(data: Data): unknown
```

```typescript
const data = { type: 'bytes', value: new Uint8Array([1, 2, 3]) };
const json = Rlp.toJSON.call(data);
// => { type: 'bytes', value: [1, 2, 3] }
```

### fromJSON

Convert JSON representation back to RLP Data (this: pattern).

```typescript
Rlp.fromJSON.call(json: unknown): Data
```

```typescript
const json = { type: 'bytes', value: [1, 2, 3] };
const data = Rlp.fromJSON.call(json);
// => { type: 'bytes', value: Uint8Array([1, 2, 3]) }
```

## Error Handling

### Rlp.Error

Custom error type for RLP operations.

```typescript
class Error extends globalThis.Error {
  constructor(
    public readonly type: ErrorType,
    message?: string
  )
}
```

### Error Types

```typescript
type ErrorType =
  | "InputTooShort"         // Not enough bytes to decode
  | "InputTooLong"          // Extra bytes after decoding
  | "LeadingZeros"          // Length encoding has leading zeros
  | "NonCanonicalSize"      // Should use shorter encoding form
  | "InvalidLength"         // Length doesn't match actual data
  | "UnexpectedInput"       // Invalid input type or prefix
  | "InvalidRemainder"      // Extra data in non-stream mode
  | "ExtraZeros"            // Unnecessary zero bytes
  | "RecursionDepthExceeded"; // Nesting too deep (> MAX_DEPTH)
```

```typescript
try {
  const result = Rlp.decode.call(bytes);
} catch (err) {
  if (err instanceof Rlp.Error) {
    console.error(`RLP Error (${err.type}):`, err.message);
  }
}
```

## Common Patterns

### Encoding Ethereum Transactions

```typescript
// Simplified legacy transaction structure
const nonce = new Uint8Array([0x09]);
const gasPrice = new Uint8Array([0x04, 0xa8, 0x17, 0xc8, 0x00]); // 20 Gwei
const gasLimit = new Uint8Array([0x52, 0x08]); // 21000
const to = new Uint8Array(20).fill(0x01); // Address
const value = new Uint8Array([0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00]); // 1 ETH
const data = new Uint8Array([]);

const transaction = [nonce, gasPrice, gasLimit, to, value, data];
const encoded = Rlp.encode.call(transaction);

// Now hash and sign encoded transaction
```

### Encoding Block Headers

```typescript
const parentHash = new Uint8Array(32);
const ommersHash = new Uint8Array(32);
const beneficiary = new Uint8Array(20);
const stateRoot = new Uint8Array(32);
// ... more fields

const header = [
  parentHash,
  ommersHash,
  beneficiary,
  stateRoot,
  // ... more fields
];

const encodedHeader = Rlp.encode.call(header);
```

### Stream Decoding

```typescript
// Decode multiple concatenated RLP values
let remaining = concatenatedRlpData;
const decoded: Rlp.Data[] = [];

while (remaining.length > 0) {
  const result = Rlp.decode.call(remaining, true);
  decoded.push(result.data);
  remaining = result.remainder;
}
```

### Working with Nested Structures

```typescript
// Build nested structure
const inner = [
  new Uint8Array([0x01]),
  new Uint8Array([0x02])
];
const outer = [
  new Uint8Array([0xff]),
  inner,
  new Uint8Array([0xaa])
];

// Encode and decode
const encoded = Rlp.encode.call(outer);
const decoded = Rlp.decode.call(encoded);

// Extract nested data
if (decoded.data.type === 'list') {
  const innerList = decoded.data.value[1];
  if (innerList?.type === 'list') {
    console.log('Nested list:', innerList.value);
  }
}
```

### Converting Between Formats

```typescript
// Uint8Array -> Data -> JSON -> Data -> Uint8Array
const original = new Uint8Array([1, 2, 3]);

// To Data
const data = Rlp.Data.fromBytes.call(original);

// To JSON
const json = Rlp.toJSON.call(data);
console.log(JSON.stringify(json));

// Back to Data
const restored = Rlp.fromJSON.call(json);

// Back to Uint8Array
const bytes = Rlp.Data.toBytes.call(restored);
console.log(bytes); // Uint8Array([1, 2, 3])
```

## Best Practices

### 1. Use Canonical Encoding

Always encode using the shortest possible form. The encoder handles this automatically.

```typescript
// Good: Let encoder choose optimal form
const encoded = Rlp.encode.call(data);

// Bad: Manual encoding may not be canonical
// (Don't manually construct RLP bytes)
```

### 2. Validate External Data

Always validate RLP data from untrusted sources.

```typescript
// Good: Decode validates automatically
try {
  const decoded = Rlp.decode.call(untrustedBytes);
  // Use decoded.data safely
} catch (err) {
  if (err instanceof Rlp.Error) {
    console.error('Invalid RLP:', err.type);
  }
}

// Bad: Assuming data is valid
const decoded = Rlp.decode.call(untrustedBytes); // May throw
```

### 3. Use Type Guards

Check Data types before accessing values.

```typescript
// Good: Type guard ensures safety
const decoded = Rlp.decode.call(bytes);
if (decoded.data.type === 'list') {
  console.log('List length:', decoded.data.value.length);
}

// Bad: Unsafe assumption
const list = decoded.data.value; // Type error if bytes
```

### 4. Handle Stream Decoding

Use stream parameter when decoding concatenated values.

```typescript
// Good: Proper stream handling
const result = Rlp.decode.call(bytes, true);
processNextValue(result.remainder);

// Bad: Non-stream mode with extra data
const result = Rlp.decode.call(bytes); // Throws on remainder
```

### 5. Pre-calculate Lengths

Use getEncodedLength for buffer allocation.

```typescript
// Good: Allocate exact size
const length = Rlp.getEncodedLength.call(data);
const buffer = new Uint8Array(length);

// Bad: Over-allocate or reallocate
const encoded = Rlp.encode.call(data);
// May waste memory or require reallocation
```

## Performance Considerations

### Operation Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| `encode` | O(n) | n = total bytes |
| `encodeBytes` | O(n) | n = byte length |
| `encodeList` | O(n×m) | n = items, m = avg size |
| `decode` | O(n) | n = encoded bytes |
| `getEncodedLength` | O(n) | n = items/bytes |
| `flatten` | O(n) | n = total items |
| `equals` | O(n) | n = data size |

### Optimization Tips

1. **Avoid repeated encoding** - Cache encoded values when possible
2. **Use stream mode** only when needed - Non-stream is faster
3. **Minimize nesting depth** - Deep nesting is slower to encode/decode
4. **Pre-allocate buffers** - Use getEncodedLength to avoid reallocation

```typescript
// Efficient: Encode once
const encoded = Rlp.encode.call(transaction);
broadcast(encoded);
store(encoded);
hash(encoded);

// Inefficient: Encode multiple times
broadcast(Rlp.encode.call(transaction));
store(Rlp.encode.call(transaction));
hash(Rlp.encode.call(transaction));
```

## Examples

### Minimal Transaction

```typescript
const tx = [
  new Uint8Array([0x00]), // nonce
  new Uint8Array([0x00]), // gasPrice
  new Uint8Array([0x00]), // gasLimit
  new Uint8Array(20),     // to
  new Uint8Array([0x00]), // value
  new Uint8Array([])      // data
];

const encoded = Rlp.encode.call(tx);
const decoded = Rlp.decode.call(encoded);
```

### Contract Creation Transaction

```typescript
const nonce = new Uint8Array([0x05]);
const gasPrice = new Uint8Array([0x09, 0x18, 0x4e, 0x72, 0xa0, 0x00]);
const gasLimit = new Uint8Array([0x1c, 0x9c, 0x38]);
const to = new Uint8Array([]); // Empty for contract creation
const value = new Uint8Array([0x00]);
const data = new Uint8Array([/* contract bytecode */]);

const createTx = [nonce, gasPrice, gasLimit, to, value, data];
const encoded = Rlp.encode.call(createTx);
```

### Deeply Nested Data

```typescript
const deep = [
  [
    [
      [new Uint8Array([0x01])],
      new Uint8Array([0x02])
    ],
    new Uint8Array([0x03])
  ],
  new Uint8Array([0x04])
];

const encoded = Rlp.encode.call(deep);
const decoded = Rlp.decode.call(encoded);

// Flatten to get all bytes
const flattened = Rlp.flatten.call(decoded.data);
console.log(flattened.length); // 4
```

## References

- [Ethereum Yellow Paper - Appendix B](https://ethereum.github.io/yellowpaper/paper.pdf)
- [RLP Specification](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/)
- [Ethereum Wiki - RLP](https://eth.wiki/fundamentals/rlp)

## API Summary

### Type Guards
- `isData(value)` - Check if value is Data structure
- `isBytesData(value)` - Check if value is bytes Data
- `isListData(value)` - Check if value is list Data

### Encoding
- `encode.call(data)` - Encode any encodable data
- `encodeBytes.call(bytes)` - Encode byte array
- `encodeList.call(items)` - Encode list

### Decoding
- `decode.call(bytes, stream?)` - Decode RLP bytes

### Data Operations
- `Data.fromBytes.call(bytes)` - Create bytes Data
- `Data.fromList.call(items)` - Create list Data
- `Data.encode.call(data)` - Encode Data
- `Data.toBytes.call(data)` - Extract bytes value
- `Data.toList.call(data)` - Extract list value

### Utilities
- `getEncodedLength.call(data)` - Calculate encoded size
- `flatten.call(data)` - Flatten nested structure
- `equals.call(a, b)` - Compare Data equality
- `toJSON.call(data)` - Convert to JSON
- `fromJSON.call(json)` - Convert from JSON

### Constants
- `MAX_DEPTH` - Maximum recursion depth (32)
