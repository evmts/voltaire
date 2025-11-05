# name.js

Get opcode name string.

## Signature

```typescript
function name(opcode: BrandedOpcode): string
```

## Parameters

- `opcode` - Opcode to query

## Returns

`string` - Opcode name or "UNKNOWN" if invalid

## Example

```typescript
Opcode.name(Opcode.ADD);        // "ADD"
Opcode.name(Opcode.PUSH1);      // "PUSH1"
Opcode.name(0x0c);              // "UNKNOWN" (undefined opcode)
```

## Notes

- Never returns undefined; uses "UNKNOWN" for invalid opcodes
- More lightweight than `info()` if only name needed

## See Also

- [info](./info.js.md) - Get full metadata
- [isValid](./isValid.js.md) - Check if opcode defined
