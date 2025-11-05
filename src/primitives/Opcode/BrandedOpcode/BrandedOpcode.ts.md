# BrandedOpcode

Branded type: `number & { __tag: "Opcode" }`

## Types

### BrandedOpcode
```typescript
type BrandedOpcode = number & { readonly __tag: "Opcode" }
```
Branded opcode byte value (0x00-0xFF).

### Instruction
```typescript
type Instruction = {
  offset: number;
  opcode: BrandedOpcode;
  immediate?: Uint8Array;
}
```
Parsed bytecode instruction with program counter offset and optional PUSH immediate data.

### Info
```typescript
type Info = {
  gasCost: number;
  stackInputs: number;
  stackOutputs: number;
  name: string;
}
```
Opcode metadata structure containing base gas cost, stack requirements, and name.

## Pattern

Branded types add type safety via phantom `__tag` property. Unlike Address which extends Uint8Array, Opcode uses simple number branding since opcodes are single bytes.
