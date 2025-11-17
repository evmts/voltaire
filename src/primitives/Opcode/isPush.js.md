---
title: "isPush.js"
---

# isPush.js

Check if opcode is PUSH instruction (PUSH0-PUSH32).

## Signature

```typescript
function isPush(opcode: BrandedOpcode): boolean
```

## Parameters

- `opcode` - Opcode to check

## Returns

`boolean` - True if PUSH0-PUSH32

## Example

```typescript
Opcode.isPush(Opcode.PUSH0);   // true
Opcode.isPush(Opcode.PUSH1);   // true
Opcode.isPush(Opcode.PUSH32);  // true
Opcode.isPush(Opcode.ADD);     // false
Opcode.isPush(Opcode.DUP1);    // false
```

## Notes

- Includes PUSH0 (0x5f) and PUSH1-PUSH32 (0x60-0x7f)
- PUSH instructions have immediate data following opcode
- Use with `pushBytes()` to get immediate data length

## See Also

- [pushBytes](./pushBytes.js.md) - Get number of immediate bytes
- [pushOpcode](./pushOpcode.js.md) - Get PUSH opcode for byte count
- [parse](./parse.js.md) - Parse bytecode with PUSH immediate data
