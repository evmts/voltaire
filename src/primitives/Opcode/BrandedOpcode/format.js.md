# format.js

Format instruction to human-readable string.

## Signature

```typescript
function format(instruction: Instruction): string
```

## Parameters

- `instruction` - Parsed instruction object

## Returns

`string` - Formatted string in format `0x{offset}: {NAME} {immediate}`

## Example

```typescript
const inst1 = {
  offset: 0,
  opcode: Opcode.PUSH1,
  immediate: new Uint8Array([0x42])
};
Opcode.format(inst1);  // "0x0000: PUSH1 0x42"

const inst2 = {
  offset: 4,
  opcode: Opcode.ADD
};
Opcode.format(inst2);  // "0x0004: ADD"
```

## Notes

- Offset formatted as hex (0x0000)
- Immediate data formatted as hex bytes
- Used by disassemble() for output

## See Also

- [disassemble](./disassemble.js.md) - Disassemble full bytecode
- [parse](./parse.js.md) - Parse bytecode to instructions
- [name](./name.js.md) - Get opcode name
