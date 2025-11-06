---
title: "isDup.js"
---

# isDup.js

Check if opcode is DUP instruction (DUP1-DUP16).

## Signature

```typescript
function isDup(opcode: BrandedOpcode): boolean
```

## Parameters

- `opcode` - Opcode to check

## Returns

`boolean` - True if DUP1-DUP16

## Example

```typescript
Opcode.isDup(Opcode.DUP1);   // true
Opcode.isDup(Opcode.DUP16);  // true
Opcode.isDup(Opcode.SWAP1);  // false
Opcode.isDup(Opcode.PUSH1);  // false
```

## Notes

- DUP1-DUP16 (0x80-0x8f)
- Use with `dupPosition()` to get stack position

## See Also

- [dupPosition](./dupPosition.js.md) - Get DUP position (1-16)
- [isSwap](./isSwap.js.md) - Check for SWAP instructions
