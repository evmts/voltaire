# logTopics.js

Get topic count for LOG instruction.

## Signature

```typescript
function logTopics(opcode: BrandedOpcode): number | undefined
```

## Parameters

- `opcode` - Opcode to query

## Returns

`number | undefined` - Topic count (0-4) or undefined if not LOG

## Example

```typescript
Opcode.logTopics(Opcode.LOG0);  // 0
Opcode.logTopics(Opcode.LOG1);  // 1
Opcode.logTopics(Opcode.LOG4);  // 4
Opcode.logTopics(Opcode.SSTORE); // undefined
```

## Notes

- LOG0 has no topics
- LOG4 has maximum 4 topics
- Non-LOG opcodes return undefined
- Topics are used for event filtering

## See Also

- [isLog](./isLog.js.md) - Check if opcode is LOG
