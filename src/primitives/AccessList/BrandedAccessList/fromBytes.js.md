# fromBytes.js

Decode RLP bytes to AccessList.

## Signature

```typescript
function fromBytes(bytes: Uint8Array): BrandedAccessList
```

## Parameters

- `bytes` - RLP-encoded access list

## Returns

`BrandedAccessList` - Decoded access list

## Throws

- Error if not RLP list
- Error if item not [address, keys] pair
- Error if address not 20 bytes
- Error if storage key not 32 bytes

## Example

```typescript
const bytes = tx.accessListBytes;
const list = AccessList.fromBytes(bytes);

console.log(list.addressCount());
```

## RLP Structure

```
[
  [address1, [key1, key2]],
  [address2, []],
  ...
]
```

## See Also

- [toBytes](./toBytes.js.md) - Encode to RLP bytes
- [from](./from.js.md) - Universal constructor
