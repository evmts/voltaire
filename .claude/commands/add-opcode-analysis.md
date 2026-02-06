# Add Opcode Analysis Functions

**Priority: LOW**

Opcode primitive exists but missing analysis utilities.

## Task
Add opcode analysis and inspection methods.

## Functions to Add

### Gas Costs
```typescript
getGasCost(opcode, hardfork): number
  // Get static gas cost for opcode

getDynamicGasCost(opcode, context): number
  // Calculate dynamic gas cost (memory, stack)

getTotalGasCost(opcode, context, hardfork): number
  // Get total gas cost
```

### Stack Effects
```typescript
getStackEffect(opcode): { pop: number, push: number }
  // Get stack items consumed/produced

getStackInput(opcode): number
  // Get input stack items

getStackOutput(opcode): number
  // Get output stack items
```

### Bytecode Analysis
```typescript
isJumpDestination(opcode): boolean
  // Check if JUMPDEST

isPush(opcode): boolean
  // Check if PUSH operation

getPushSize(opcode): number
  // Get PUSH data size (1-32)

isTerminator(opcode): boolean
  // Check if control flow terminator (STOP, RETURN, REVERT, etc)
```

### Metadata
```typescript
getName(opcode): string
  // Get mnemonic name

getCategory(opcode): string
  // Get category (arithmetic, logic, stack, memory, storage, etc)

isValidOpcode(value): boolean
  // Check if valid opcode value

getDescription(opcode): string
  // Get human-readable description
```

## Files
Add to `src/primitives/Opcode/` namespace.

## Reference
- Yellow Paper for gas costs
- EVM opcode reference

## Verification
```bash
bun run test -- Opcode
```
