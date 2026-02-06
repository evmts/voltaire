---
title: "swapPosition.js"
---

# swapPosition.js

Get stack position for SWAP instruction.

## Signature

```typescript
function swapPosition(opcode: BrandedOpcode): number | undefined
```

## Parameters

- `opcode` - Opcode to query

## Returns

`number | undefined` - Position (1-16) or undefined if not SWAP

## Example

```typescript
Opcode.swapPosition(Opcode.SWAP1);   // 1
Opcode.swapPosition(Opcode.SWAP2);   // 2
Opcode.swapPosition(Opcode.SWAP16);  // 16
Opcode.swapPosition(Opcode.DUP1);    // undefined
Opcode.swapPosition(Opcode.ADD);     // undefined
```

## Notes

- SWAP1 swaps top with 2nd item (position 1)
- SWAP16 swaps top with 17th item (position 16)
- Non-SWAP opcodes return undefined

## See Also

- [isSwap](./isSwap.js.md) - Check if opcode is SWAP
- [dupPosition](./dupPosition.js.md) - Get DUP position
