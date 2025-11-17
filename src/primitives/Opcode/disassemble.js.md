---
title: "disassemble.js"
---

# disassemble.js

Disassemble bytecode to human-readable strings.

## Signature

```typescript
function disassemble(bytecode: Uint8Array): string[]
```

## Parameters

- `bytecode` - Raw bytecode bytes

## Returns

`string[]` - Array of formatted instruction strings

## Example

```typescript
const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
const asm = Opcode.disassemble(bytecode);
// [
//   "0x0000: PUSH1 0x01",
//   "0x0002: PUSH1 0x02",
//   "0x0004: ADD"
// ]

console.log(asm.join('
'));
// 0x0000: PUSH1 0x01
// 0x0002: PUSH1 0x02
// 0x0004: ADD
```

## Example with Analysis

```typescript
function disassembleWithAnalysis(bytecode: Uint8Array): void {
  const instructions = Opcode.parse(bytecode);
  const dests = Opcode.jumpDests(bytecode);

  for (const inst of instructions) {
    const formatted = Opcode.format(inst);
    const info = Opcode.info(inst.opcode);

    console.log(formatted);

    if (info) {
      console.log(`  Gas: ${info.gasCost}`);
      console.log(`  Stack: ${info.stackInputs} → ${info.stackOutputs}`);
    }

    if (dests.has(inst.offset)) {
      console.log(`  [JUMPDEST]`);
    }
  }
}
```

## Notes

- Convenience wrapper around parse() + format()
- Each string is one instruction
- Join with newlines for readable output

## See Also

- [parse](./parse.js.md) - Parse bytecode
- [format](./format.js.md) - Format single instruction
- [jumpDests](./jumpDests.js.md) - Find jump destinations
