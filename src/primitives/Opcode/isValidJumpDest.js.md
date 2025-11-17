---
title: "isValidJumpDest.js"
---

# isValidJumpDest.js

Check if bytecode offset is a valid jump destination.

## Signature

```typescript
function isValidJumpDest(bytecode: Uint8Array, offset: number): boolean
```

## Parameters

- `bytecode` - Raw bytecode bytes
- `offset` - Byte offset to check

## Returns

`boolean` - True if offset is valid JUMPDEST

## Example

```typescript
const bytecode = new Uint8Array([0x5b, 0x60, 0x5b]);
Opcode.isValidJumpDest(bytecode, 0);  // true (JUMPDEST)
Opcode.isValidJumpDest(bytecode, 1);  // false (PUSH1)
Opcode.isValidJumpDest(bytecode, 2);  // false (inside PUSH data)
```

## Example with JUMP Validation

```typescript
function isValidJump(bytecode: Uint8Array, jumpTarget: number): boolean {
  return Opcode.isValidJumpDest(bytecode, jumpTarget);
}

// Validate runtime jump
const code = new Uint8Array([0x5b, 0x60, 0x00, 0x56]);  // JUMPDEST, PUSH1 0, JUMP
if (isValidJump(code, 0)) {
  console.log("Jump to 0 is valid");
}
```

## Notes

- Valid jump destinations must be:
  1. JUMPDEST (0x5b) opcode
  2. Not inside PUSH immediate data
- Uses `jumpDests()` internally
- More convenient than checking set membership

## See Also

- [jumpDests](./jumpDests.js.md) - Get all valid JUMPDEST locations
- [isJump](./isJump.js.md) - Check for JUMP/JUMPI instructions
- [parse](./parse.js.md) - Parse bytecode
