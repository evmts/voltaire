# toBytes.js

Encode access list to RLP bytes.

## Signature

```typescript
function toBytes(list: BrandedAccessList): Uint8Array
```

## Parameters

- `list` - Access list to encode

## Returns

`Uint8Array` - RLP-encoded bytes

## Example

```typescript
const list = AccessList.from([
  { address: addr1, storageKeys: [key1, key2] },
  { address: addr2, storageKeys: [] }
]);

const bytes = AccessList.toBytes(list);
// Can be included in transaction encoding
```

## RLP Structure

```
[
  [address1, [key1, key2]],
  [address2, []],
  ...
]
```

## Encoding Rules

- Top-level list of items
- Each item is [address, keys] pair
- Address encoded as 20-byte string
- Keys encoded as list of 32-byte strings
- Empty storageKeys encoded as empty list

## See Also

- [fromBytes](./fromBytes.js.md) - Decode from RLP bytes
- [RLP](../../Rlp/index.mdx) - RLP encoding
