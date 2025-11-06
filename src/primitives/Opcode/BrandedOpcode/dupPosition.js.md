---
title: "dupPosition.js"
---

# dupPosition.js

Get stack position for DUP instruction.

## Signature

```typescript
function dupPosition(opcode: BrandedOpcode): number | undefined
```

## Parameters

- `opcode` - Opcode to query

## Returns

`number | undefined` - Position (1-16) or undefined if not DUP

## Example

```typescript
Opcode.dupPosition(Opcode.DUP1);   // 1
Opcode.dupPosition(Opcode.DUP2);   // 2
Opcode.dupPosition(Opcode.DUP16);  // 16
Opcode.dupPosition(Opcode.SWAP1);  // undefined
Opcode.dupPosition(Opcode.ADD);    // undefined
```

## Notes

- DUP1 duplicates top stack item (position 1)
- DUP16 duplicates 16th item from top
- Non-DUP opcodes return undefined

## See Also

- [isDup](./isDup.js.md) - Check if opcode is DUP
- [swapPosition](./swapPosition.js.md) - Get SWAP position
