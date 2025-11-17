---
title: "isLog.js"
---

# isLog.js

Check if opcode is LOG instruction (LOG0-LOG4).

## Signature

```typescript
function isLog(opcode: BrandedOpcode): boolean
```

## Parameters

- `opcode` - Opcode to check

## Returns

`boolean` - True if LOG0-LOG4

## Example

```typescript
Opcode.isLog(Opcode.LOG0);   // true
Opcode.isLog(Opcode.LOG4);   // true
Opcode.isLog(Opcode.SSTORE); // false
```

## Notes

- LOG0-LOG4 (0xa0-0xa4)
- Use with `logTopics()` to get topic count

## See Also

- [logTopics](./logTopics.js.md) - Get LOG topic count (0-4)
