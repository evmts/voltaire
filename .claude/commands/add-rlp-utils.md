# Add RLP Utility Functions

**Priority: LOW**

RLP core works but missing convenience functions.

## Task
Add utility methods to RLP namespace.

## Functions to Add

### Convenience Encoding
```typescript
encodeArray(items: Encodable[]): Uint8Array
  // Encode array of values

encodeObject(obj: Record<string, Encodable>): Uint8Array
  // Encode object (key-value pairs)

encodeList(...items: Encodable[]): Uint8Array
  // Encode variadic list
```

### Convenience Decoding
```typescript
decodeArray(data: Uint8Array): any[]
  // Decode to array

decodeObject(data: Uint8Array, keys: string[]): Record<string, any>
  // Decode to object with known keys
```

### Validation
```typescript
validate(data: Uint8Array): boolean
  // Check if valid RLP encoding

getLength(data: Uint8Array): number
  // Get total length of RLP item

isList(data: Uint8Array): boolean
  // Check if RLP encodes list

isString(data: Uint8Array): boolean
  // Check if RLP encodes string
```

### Batch Operations
```typescript
encodeBatch(items: Encodable[][]): Uint8Array[]
  // Encode multiple items efficiently

decodeBatch(data: Uint8Array[]): any[][]
  // Decode multiple items
```

## Files
Add to `src/primitives/Rlp/` namespace.

## Verification
```bash
bun run test -- Rlp
```
