# isValid.js

Type guard checking if opcode is defined.

## Signature

```typescript
function isValid(opcode: number): opcode is BrandedOpcode
```

## Parameters

- `opcode` - Byte value to check

## Returns

`boolean` - True if opcode defined in EVM

## Example

```typescript
Opcode.isValid(0x01);  // true (ADD)
Opcode.isValid(0x60);  // true (PUSH1)
Opcode.isValid(0x0c);  // false (undefined)
Opcode.isValid(0x21);  // false (undefined)
```

## Notes

- Type guard narrows to BrandedOpcode
- Not all byte values 0x00-0xFF are valid opcodes
- Gaps exist in opcode space

## See Also

- [info](./info.js.md) - Get full metadata
- [name](./name.js.md) - Get opcode name
