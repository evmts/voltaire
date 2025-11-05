# pushOpcode.js

Get PUSH opcode for given byte count.

## Signature

```typescript
function pushOpcode(bytes: number): BrandedOpcode
```

## Parameters

- `bytes` - Number of bytes to push (0-32)

## Returns

`BrandedOpcode` - Corresponding PUSH opcode

## Throws

If bytes not in 0-32 range

## Example

```typescript
Opcode.pushOpcode(0);   // Opcode.PUSH0
Opcode.pushOpcode(1);   // Opcode.PUSH1
Opcode.pushOpcode(2);   // Opcode.PUSH2
Opcode.pushOpcode(32);  // Opcode.PUSH32
Opcode.pushOpcode(33);  // throws
Opcode.pushOpcode(-1);  // throws
```

## Notes

- Inverse of `pushBytes()`
- Validates range before returning
- Used for bytecode generation

## See Also

- [pushBytes](./pushBytes.js.md) - Get byte count from PUSH opcode
- [isPush](./isPush.js.md) - Check if opcode is PUSH
