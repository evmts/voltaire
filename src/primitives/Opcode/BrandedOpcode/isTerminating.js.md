# isTerminating.js

Check if opcode terminates execution.

## Signature

```typescript
function isTerminating(opcode: BrandedOpcode): boolean
```

## Parameters

- `opcode` - Opcode to check

## Returns

`boolean` - True if execution-terminating opcode

## Example

```typescript
Opcode.isTerminating(Opcode.STOP);        // true
Opcode.isTerminating(Opcode.RETURN);      // true
Opcode.isTerminating(Opcode.REVERT);      // true
Opcode.isTerminating(Opcode.INVALID);     // true
Opcode.isTerminating(Opcode.SELFDESTRUCT); // true
Opcode.isTerminating(Opcode.JUMP);        // false
Opcode.isTerminating(Opcode.ADD);         // false
```

## Notes

- Terminating opcodes: STOP, RETURN, REVERT, INVALID, SELFDESTRUCT
- Control flow analysis uses this for basic block boundaries
- JUMP/JUMPI are not terminating (they transfer control)

## See Also

- [isJump](./isJump.js.md) - Check for jump instructions
