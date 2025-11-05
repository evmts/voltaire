# parse.js

Parse bytecode into instructions with offsets and immediate data.

## Signature

```typescript
function parse(bytecode: Uint8Array): Instruction[]
```

## Parameters

- `bytecode` - Raw bytecode bytes

## Returns

`Instruction[]` - Array of parsed instructions

### Instruction Structure
```typescript
{
  offset: number;           // Byte offset in code
  opcode: BrandedOpcode;    // The opcode
  immediate?: Uint8Array;   // PUSH immediate data (if PUSH)
}
```

## Example

```typescript
const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
const instructions = Opcode.parse(bytecode);
// [
//   { offset: 0, opcode: PUSH1, immediate: Uint8Array[0x01] },
//   { offset: 2, opcode: PUSH1, immediate: Uint8Array[0x02] },
//   { offset: 4, opcode: ADD }
// ]

for (const inst of instructions) {
  const info = Opcode.info(inst.opcode);
  console.log(`${inst.offset}: ${info?.name}`);
  if (inst.immediate) {
    console.log(`  Data: ${Array.from(inst.immediate)}`);
  }
}
```

## Notes

- Handles PUSH immediate data correctly
- Truncated PUSH data handled gracefully (returns partial data)
- Offsets account for immediate bytes
- Use for disassembly, analysis, or validation

## See Also

- [format](./format.js.md) - Format instruction to string
- [disassemble](./disassemble.js.md) - Full disassembly
- [isPush](./isPush.js.md) - Check for PUSH instructions
- [pushBytes](./pushBytes.js.md) - Get immediate data length
