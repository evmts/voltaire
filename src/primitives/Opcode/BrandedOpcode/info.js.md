# info.js

Get opcode metadata including gas cost and stack requirements.

## Signature

```typescript
function info(opcode: BrandedOpcode): Info | undefined
```

## Parameters

- `opcode` - Opcode to query

## Returns

`Info | undefined` - Metadata object or undefined if opcode invalid

### Info Structure
```typescript
{
  gasCost: number;        // Base gas cost
  stackInputs: number;    // Stack items consumed
  stackOutputs: number;   // Stack items produced
  name: string;           // Opcode name
}
```

## Example

```typescript
const info = Opcode.info(Opcode.ADD);
console.log(info?.name);          // "ADD"
console.log(info?.gasCost);       // 3
console.log(info?.stackInputs);   // 2
console.log(info?.stackOutputs);  // 1
```

## Notes

- Gas costs are base values; some opcodes have dynamic costs at runtime
- Returns undefined for invalid/unrecognized opcodes
- All defined opcodes from 0x00-0xFF are in lookup table

## See Also

- [name](./name.js.md) - Get opcode name only
- [isValid](./isValid.js.md) - Check if opcode defined
- [constants](./constants.js.md) - All opcode constants
