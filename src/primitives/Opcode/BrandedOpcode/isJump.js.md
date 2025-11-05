# isJump.js

Check if opcode is jump instruction (JUMP or JUMPI).

## Signature

```typescript
function isJump(opcode: BrandedOpcode): boolean
```

## Parameters

- `opcode` - Opcode to check

## Returns

`boolean` - True if JUMP or JUMPI

## Example

```typescript
Opcode.isJump(Opcode.JUMP);    // true
Opcode.isJump(Opcode.JUMPI);   // true
Opcode.isJump(Opcode.JUMPDEST); // false
Opcode.isJump(Opcode.PC);      // false
```

## Notes

- Only JUMP (0x56) and JUMPI (0x57)
- JUMPDEST (0x5b) is not a jump instruction
- Use with jump destination analysis

## See Also

- [jumpDests](./jumpDests.js.md) - Find valid jump destinations
- [isValidJumpDest](./isValidJumpDest.js.md) - Check if offset is valid JUMPDEST
