---
title: "assertValid.js"
---

# assertValid.js

Validate AccessList structure with detailed error messages.

## Signature

```typescript
function assertValid(list: unknown): asserts list is BrandedAccessList
```

## Parameters

- `list` - Value to validate

## Returns

Nothing (asserts type)

## Throws

- Error if not array
- Error if item has invalid structure
- Error if address not 20 bytes
- Error if storage key not 32 bytes

## Example

```typescript
try {
  AccessList.assertValid(list);
  // Safe to use as AccessList
  processAccessList(list);
} catch (err) {
  console.error('Invalid:', err.message);
}
```

## Validation

- List must be array
- Each item must have `address` and `storageKeys`
- Addresses must be 20 bytes
- Storage keys must be 32 bytes each

## See Also

- [is](./is.js.md) - Type guard without throws
- [isItem](./isItem.js.md) - Check individual item
