---
title: "isSwap.js"
---

# isSwap.js

Check if opcode is SWAP instruction (SWAP1-SWAP16).

## Signature

```typescript
function isSwap(opcode: BrandedOpcode): boolean
```

## Parameters

- `opcode` - Opcode to check

## Returns

`boolean` - True if SWAP1-SWAP16

## Example

```typescript
Opcode.isSwap(Opcode.SWAP1);   // true
Opcode.isSwap(Opcode.SWAP16);  // true
Opcode.isSwap(Opcode.DUP1);    // false
Opcode.isSwap(Opcode.PUSH1);   // false
```

## Notes

- SWAP1-SWAP16 (0x90-0x9f)
- Use with `swapPosition()` to get stack position

## See Also

- [swapPosition](./swapPosition.js.md) - Get SWAP position (1-16)
- [isDup](./isDup.js.md) - Check for DUP instructions
