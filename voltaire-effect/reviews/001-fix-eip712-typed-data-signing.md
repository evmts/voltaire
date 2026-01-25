# Review: Fix EIP-712 Typed Data Signing

## Priority: 🔴 CRITICAL

## Summary

The EIP-712 typed data signing implementation in `LocalAccount.ts` is broken for any non-trivial typed data with nested types or arrays.

## Problem

The current implementation has three bugs:

### 1. Missing Dependency Type Resolution
**File**: [LocalAccount.ts#L184-L192](../src/services/Account/LocalAccount.ts#L184-L192)

```typescript
function hashType(name, fields, keccak256) {
  const typeString = `${name}(${fields.map((f) => `${f.type} ${f.name}`).join(",")})`;
  // ...
}
```

When a type like `Mail` references another type like `Person`, the type encoding should include all dependencies sorted alphabetically:
```
Mail(Person from,Person to,string contents)Person(string name,address wallet)
```

Currently only encodes the top-level type.

### 2. Array Types Not Handled
**File**: [LocalAccount.ts#L220-L267](../src/services/Account/LocalAccount.ts#L220-L267)

The `encodeValue` function doesn't handle array types like `uint256[]` or `Person[]`. Arrays require:
- Encoding each element
- Concatenating the encoded values
- Hashing the concatenation

### 3. Missing Recursive Struct Hashing  
**File**: [LocalAccount.ts#L165-L182](../src/services/Account/LocalAccount.ts#L165-L182)

When a field is a custom struct type, `hashStruct` doesn't recursively hash the nested struct - it falls through to the default case returning empty bytes.

## Impact

- **Invalid signatures** for any typed data with nested types
- **Incompatible** with most real-world EIP-712 use cases (Permit2, OpenSea, etc.)
- **Security risk** - signatures may be valid for wrong data

## Fix Required

1. Implement `findTypeDependencies(primaryType, types)` to collect all referenced types
2. Sort dependencies alphabetically and append to type encoding
3. Handle array types with proper encoding
4. Recursively call `hashStruct` for nested struct types

## Reference Implementation

See viem's implementation:
- [hashTypedData.ts](https://github.com/wevm/viem/blob/main/src/utils/signature/hashTypedData.ts)

## Testing

Add test cases for:
- Nested struct types (Person inside Mail)
- Array of primitives (`uint256[]`)
- Array of structs (`Person[]`)
- Deeply nested types
- EIP-2612 Permit signature
