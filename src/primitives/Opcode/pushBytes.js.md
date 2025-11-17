---
title: "pushBytes.js"
---

# pushBytes.js

Get number of bytes pushed by PUSH instruction.

## Signature

```typescript
function pushBytes(opcode: BrandedOpcode): number | undefined
```

## Parameters

- `opcode` - Opcode to query

## Returns

`number | undefined` - Byte count (0-32) or undefined if not PUSH

## Example

```typescript
Opcode.pushBytes(Opcode.PUSH0);   // 0
Opcode.pushBytes(Opcode.PUSH1);   // 1
Opcode.pushBytes(Opcode.PUSH2);   // 2
Opcode.pushBytes(Opcode.PUSH32);  // 32
Opcode.pushBytes(Opcode.ADD);     // undefined
```

## Notes

- PUSH0 returns 0 (no immediate data)
- PUSH1-PUSH32 return 1-32
- Non-PUSH opcodes return undefined
- Used for bytecode parsing to skip immediate data

## See Also

- [isPush](./isPush.js.md) - Check if opcode is PUSH
- [pushOpcode](./pushOpcode.js.md) - Get PUSH opcode for byte count
- [parse](./parse.js.md) - Parse bytecode with immediate data
