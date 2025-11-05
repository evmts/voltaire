# jumpDests.js

Find all valid JUMPDEST locations in bytecode.

## Signature

```typescript
function jumpDests(bytecode: Uint8Array): Set<number>
```

## Parameters

- `bytecode` - Raw bytecode bytes

## Returns

`Set<number>` - Set of valid jump destination offsets

## Example

```typescript
const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);
const dests = Opcode.jumpDests(bytecode);  // Set { 0, 3 }

console.log(dests.has(0));  // true (JUMPDEST at 0)
console.log(dests.has(3));  // true (JUMPDEST at 3)
console.log(dests.has(1));  // false (PUSH1 at 1)
```

## Example with Invalid PUSH Data

```typescript
// PUSH1 with JUMPDEST as immediate data
const bytecode = new Uint8Array([0x60, 0x5b, 0x5b]);
const dests = Opcode.jumpDests(bytecode);  // Set { 2 }
// Only offset 2 is valid; offset 1 is inside PUSH immediate
```

## Notes

- Only returns actual JUMPDEST (0x5b) opcodes
- Correctly skips JUMPDEST bytes inside PUSH immediate data
- Valid jump destinations must be:
  1. JUMPDEST opcode
  2. Not inside PUSH immediate data
- Use with `isValidJumpDest()` to check specific offset

## See Also

- [isValidJumpDest](./isValidJumpDest.js.md) - Check if offset is valid JUMPDEST
- [isJump](./isJump.js.md) - Check for JUMP/JUMPI instructions
- [parse](./parse.js.md) - Parse bytecode
