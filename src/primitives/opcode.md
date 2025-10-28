# Opcode

EVM opcode definitions, metadata, and bytecode analysis utilities.

## Overview

Complete EVM opcode implementation with:
- All EVM opcodes (0x00-0xff)
- Opcode metadata (gas cost, stack requirements, names)
- Category checks (PUSH, DUP, SWAP, LOG, etc.)
- Bytecode parsing and disassembly
- Jump destination analysis
- Stack and gas analysis

## Quick Start

```typescript
import { Opcode } from './opcode.js';

// Get opcode info
const info = Opcode.getInfo(Opcode.Code.ADD);
console.log(info.name);          // "ADD"
console.log(info.gasCost);       // 3
console.log(info.stackInputs);   // 2
console.log(info.stackOutputs);  // 1

// Category checks
Opcode.isPush(Opcode.Code.PUSH1);    // true
Opcode.isDup(Opcode.Code.DUP1);      // true
Opcode.isJump(Opcode.Code.JUMP);     // true

// Parse bytecode
const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
const instructions = Opcode.parseBytecode(bytecode);
// [
//   { offset: 0, opcode: PUSH1, immediate: [0x01] },
//   { offset: 2, opcode: PUSH1, immediate: [0x02] },
//   { offset: 4, opcode: ADD }
// ]

// Disassemble
const asm = Opcode.disassemble(bytecode);
// [
//   "0x0000: PUSH1 0x01",
//   "0x0002: PUSH1 0x02",
//   "0x0004: ADD"
// ]
```

## API Reference

### Types

#### `Opcode.Code`
```typescript
enum Code {
  STOP = 0x00,
  ADD = 0x01,
  MUL = 0x02,
  // ... all EVM opcodes
}
```

#### `Opcode.Info`
```typescript
type Info = {
  gasCost: number;      // Base gas cost
  stackInputs: number;  // Stack items consumed
  stackOutputs: number; // Stack items produced
  name: string;         // Opcode name
};
```

#### `Opcode.Instruction`
```typescript
type Instruction = {
  offset: number;           // Byte offset in code
  opcode: Code;             // The opcode
  immediate?: Uint8Array;   // PUSH immediate data
};
```

### Opcode Info

#### `getInfo(opcode: Code): Info | undefined`
Get metadata for an opcode.

```typescript
const info = Opcode.getInfo(Opcode.Code.ADD);
if (info) {
  console.log(`${info.name}: ${info.gasCost} gas`);
  console.log(`Stack: ${info.stackInputs} → ${info.stackOutputs}`);
}
```

**this: pattern:**
```typescript
const info = Opcode.info.call(Opcode.Code.ADD);
```

#### `getName(opcode: Code): string`
Get opcode name (returns "UNKNOWN" if invalid).

```typescript
Opcode.getName(Opcode.Code.ADD);  // "ADD"
Opcode.getName(0x0c);             // "UNKNOWN"
```

**this: pattern:**
```typescript
Opcode.name.call(Opcode.Code.ADD);
```

#### `isValid(opcode: number): opcode is Code`
Check if opcode is defined.

```typescript
Opcode.isValid(0x01);  // true (ADD)
Opcode.isValid(0x0c);  // false (undefined)
```

**this: pattern:**
```typescript
Opcode.valid.call(0x01);
```

### Category Checks

#### `isPush(opcode: Code): boolean`
Check if opcode is PUSH0-PUSH32.

```typescript
Opcode.isPush(Opcode.Code.PUSH1);   // true
Opcode.isPush(Opcode.Code.PUSH32);  // true
Opcode.isPush(Opcode.Code.ADD);     // false
```

**this: pattern:** `Opcode.push.call(opcode)`

#### `isDup(opcode: Code): boolean`
Check if opcode is DUP1-DUP16.

```typescript
Opcode.isDup(Opcode.Code.DUP1);   // true
Opcode.isDup(Opcode.Code.DUP16);  // true
```

**this: pattern:** `Opcode.dup.call(opcode)`

#### `isSwap(opcode: Code): boolean`
Check if opcode is SWAP1-SWAP16.

```typescript
Opcode.isSwap(Opcode.Code.SWAP1);   // true
Opcode.isSwap(Opcode.Code.SWAP16);  // true
```

**this: pattern:** `Opcode.swap.call(opcode)`

#### `isLog(opcode: Code): boolean`
Check if opcode is LOG0-LOG4.

```typescript
Opcode.isLog(Opcode.Code.LOG1);  // true
Opcode.isLog(Opcode.Code.LOG4);  // true
```

**this: pattern:** `Opcode.log.call(opcode)`

#### `isTerminating(opcode: Code): boolean`
Check if opcode terminates execution (STOP, RETURN, REVERT, INVALID, SELFDESTRUCT).

```typescript
Opcode.isTerminating(Opcode.Code.RETURN);  // true
Opcode.isTerminating(Opcode.Code.ADD);     // false
```

**this: pattern:** `Opcode.terminating.call(opcode)`

#### `isJump(opcode: Code): boolean`
Check if opcode is JUMP or JUMPI.

```typescript
Opcode.isJump(Opcode.Code.JUMP);   // true
Opcode.isJump(Opcode.Code.JUMPI);  // true
```

**this: pattern:** `Opcode.jump.call(opcode)`

### PUSH Operations

#### `getPushBytes(opcode: Code): number | undefined`
Get number of bytes pushed (0-32).

```typescript
Opcode.getPushBytes(Opcode.Code.PUSH0);   // 0
Opcode.getPushBytes(Opcode.Code.PUSH1);   // 1
Opcode.getPushBytes(Opcode.Code.PUSH32);  // 32
Opcode.getPushBytes(Opcode.Code.ADD);     // undefined
```

**this: pattern:** `Opcode.pushBytes.call(opcode)`

#### `getPushOpcode(bytes: number): Code`
Get PUSH opcode for byte count (throws if invalid).

```typescript
Opcode.getPushOpcode(0);   // Opcode.Code.PUSH0
Opcode.getPushOpcode(1);   // Opcode.Code.PUSH1
Opcode.getPushOpcode(32);  // Opcode.Code.PUSH32
Opcode.getPushOpcode(33);  // throws
```

**this: pattern:** `Opcode.pushOpcode.call(bytes)`

### DUP/SWAP/LOG Operations

#### `getDupPosition(opcode: Code): number | undefined`
Get DUP position (1-16).

```typescript
Opcode.getDupPosition(Opcode.Code.DUP1);   // 1
Opcode.getDupPosition(Opcode.Code.DUP16);  // 16
```

**this: pattern:** `Opcode.dupPosition.call(opcode)`

#### `getSwapPosition(opcode: Code): number | undefined`
Get SWAP position (1-16).

```typescript
Opcode.getSwapPosition(Opcode.Code.SWAP1);   // 1
Opcode.getSwapPosition(Opcode.Code.SWAP16);  // 16
```

**this: pattern:** `Opcode.swapPosition.call(opcode)`

#### `getLogTopics(opcode: Code): number | undefined`
Get LOG topic count (0-4).

```typescript
Opcode.getLogTopics(Opcode.Code.LOG0);  // 0
Opcode.getLogTopics(Opcode.Code.LOG4);  // 4
```

**this: pattern:** `Opcode.logTopics.call(opcode)`

### Bytecode Parsing

#### `parseBytecode(bytecode: Uint8Array): Instruction[]`
Parse bytecode into instructions.

```typescript
const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
const instructions = Opcode.parseBytecode(bytecode);

for (const inst of instructions) {
  const info = Opcode.getInfo(inst.opcode);
  console.log(`${inst.offset}: ${info?.name}`);
  if (inst.immediate) {
    console.log(`  Data: ${Array.from(inst.immediate)}`);
  }
}
```

**this: pattern:** `Opcode.parse.call(bytecode)`

#### `formatInstruction(instruction: Instruction): string`
Format instruction to human-readable string.

```typescript
const inst: Opcode.Instruction = {
  offset: 0,
  opcode: Opcode.Code.PUSH1,
  immediate: new Uint8Array([0x42])
};
Opcode.formatInstruction(inst);  // "0x0000: PUSH1 0x42"
```

**this: pattern:** `Opcode.format.call(instruction)`

#### `disassemble(bytecode: Uint8Array): string[]`
Disassemble bytecode to strings.

```typescript
const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
const asm = Opcode.disassemble(bytecode);
console.log(asm.join('\n'));
// 0x0000: PUSH1 0x01
// 0x0002: PUSH1 0x02
// 0x0004: ADD
```

### Jump Destination Analysis

#### `findJumpDests(bytecode: Uint8Array): Set<number>`
Find all valid JUMPDEST locations.

```typescript
const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);
const dests = Opcode.findJumpDests(bytecode);  // Set { 0, 3 }
```

**this: pattern:** `Opcode.jumpDests.call(bytecode)`

#### `isValidJumpDest(bytecode: Uint8Array, offset: number): boolean`
Check if offset is a valid jump destination.

```typescript
const bytecode = new Uint8Array([0x5b, 0x60, 0x5b]);
Opcode.isValidJumpDest(bytecode, 0);  // true (JUMPDEST)
Opcode.isValidJumpDest(bytecode, 2);  // false (inside PUSH data)
```

**this: pattern:** `Opcode.validJumpDest.call(bytecode, offset)`

## Opcode Categories

### Arithmetic (0x00-0x0b)
`STOP`, `ADD`, `MUL`, `SUB`, `DIV`, `SDIV`, `MOD`, `SMOD`, `ADDMOD`, `MULMOD`, `EXP`, `SIGNEXTEND`

### Comparison & Bitwise (0x10-0x1d)
`LT`, `GT`, `SLT`, `SGT`, `EQ`, `ISZERO`, `AND`, `OR`, `XOR`, `NOT`, `BYTE`, `SHL`, `SHR`, `SAR`

### Crypto (0x20)
`KECCAK256`

### Environment (0x30-0x3f)
`ADDRESS`, `BALANCE`, `ORIGIN`, `CALLER`, `CALLVALUE`, `CALLDATALOAD`, `CALLDATASIZE`, `CALLDATACOPY`, `CODESIZE`, `CODECOPY`, `GASPRICE`, `EXTCODESIZE`, `EXTCODECOPY`, `RETURNDATASIZE`, `RETURNDATACOPY`, `EXTCODEHASH`

### Block Info (0x40-0x4a)
`BLOCKHASH`, `COINBASE`, `TIMESTAMP`, `NUMBER`, `DIFFICULTY`, `GASLIMIT`, `CHAINID`, `SELFBALANCE`, `BASEFEE`, `BLOBHASH`, `BLOBBASEFEE`

### Stack/Memory/Storage (0x50-0x5e)
`POP`, `MLOAD`, `MSTORE`, `MSTORE8`, `SLOAD`, `SSTORE`, `JUMP`, `JUMPI`, `PC`, `MSIZE`, `GAS`, `JUMPDEST`, `TLOAD`, `TSTORE`, `MCOPY`, `PUSH0`

### PUSH (0x60-0x7f)
`PUSH1` through `PUSH32` - Push 1-32 bytes onto stack

### DUP (0x80-0x8f)
`DUP1` through `DUP16` - Duplicate stack items

### SWAP (0x90-0x9f)
`SWAP1` through `SWAP16` - Swap stack items

### LOG (0xa0-0xa4)
`LOG0` through `LOG4` - Emit logs with 0-4 topics

### System (0xf0-0xff)
`CREATE`, `CALL`, `CALLCODE`, `RETURN`, `DELEGATECALL`, `CREATE2`, `AUTH`, `AUTHCALL`, `STATICCALL`, `REVERT`, `INVALID`, `SELFDESTRUCT`

## Common Patterns

### Opcode Validation
```typescript
function validateOpcode(byte: number): void {
  if (!Opcode.isValid(byte)) {
    throw new Error(`Invalid opcode: 0x${byte.toString(16)}`);
  }
  const name = Opcode.getName(byte);
  console.log(`Valid opcode: ${name}`);
}
```

### Gas Estimation
```typescript
function estimateGas(bytecode: Uint8Array): number {
  const instructions = Opcode.parseBytecode(bytecode);
  let totalGas = 0;

  for (const inst of instructions) {
    const info = Opcode.getInfo(inst.opcode);
    if (info) {
      totalGas += info.gasCost;
    }
  }

  return totalGas;
}
```

### Stack Analysis
```typescript
function analyzeStack(bytecode: Uint8Array): {
  valid: boolean;
  maxDepth: number;
} {
  const instructions = Opcode.parseBytecode(bytecode);
  let stackSize = 0;
  let maxDepth = 0;

  for (const inst of instructions) {
    const info = Opcode.getInfo(inst.opcode);
    if (!info) continue;

    // Check underflow
    if (stackSize < info.stackInputs) {
      return { valid: false, maxDepth };
    }

    stackSize = stackSize - info.stackInputs + info.stackOutputs;
    maxDepth = Math.max(maxDepth, stackSize);
  }

  return { valid: true, maxDepth };
}
```

### Jump Analysis
```typescript
function analyzeJumps(bytecode: Uint8Array): {
  jumps: number[];
  dests: number[];
  validJumps: boolean;
} {
  const instructions = Opcode.parseBytecode(bytecode);
  const dests = Opcode.findJumpDests(bytecode);
  const jumps: number[] = [];

  for (const inst of instructions) {
    if (Opcode.isJump(inst.opcode)) {
      jumps.push(inst.offset);
    }
  }

  return {
    jumps,
    dests: Array.from(dests),
    validJumps: true  // Would need runtime analysis
  };
}
```

### Bytecode Disassembler
```typescript
function disassembleWithAnalysis(bytecode: Uint8Array): void {
  const instructions = Opcode.parseBytecode(bytecode);
  const dests = Opcode.findJumpDests(bytecode);

  for (const inst of instructions) {
    const formatted = Opcode.formatInstruction(inst);
    const info = Opcode.getInfo(inst.opcode);

    console.log(formatted);

    if (info) {
      console.log(`  Gas: ${info.gasCost}`);
      console.log(`  Stack: ${info.stackInputs} → ${info.stackOutputs}`);
    }

    if (dests.has(inst.offset)) {
      console.log(`  [JUMPDEST]`);
    }
  }
}
```

### Opcode Statistics
```typescript
function analyzeOpcodes(bytecode: Uint8Array): Map<string, number> {
  const instructions = Opcode.parseBytecode(bytecode);
  const stats = new Map<string, number>();

  for (const inst of instructions) {
    const name = Opcode.getName(inst.opcode);
    stats.set(name, (stats.get(name) || 0) + 1);
  }

  return stats;
}
```

## Best Practices

### Opcode Handling
- Always validate opcodes before processing
- Use `getInfo()` to access metadata safely
- Check for `undefined` when working with unknown opcodes

### Bytecode Parsing
- Parse bytecode once and cache instructions
- Handle truncated PUSH data gracefully
- Account for immediate data when calculating offsets

### Gas Estimation
- Remember base gas costs are minimums
- Account for dynamic costs (memory expansion, storage, etc.)
- Use opcode metadata as starting point only

### Stack Analysis
- Track stack depth during execution
- Validate sufficient inputs for each operation
- Check for stack overflow (1024 items max)

### Jump Analysis
- Only JUMPDESTs are valid jump targets
- Jumps into immediate data are invalid
- Parse bytecode to find valid JUMPDEST locations

### Performance
- Cache parsed instructions for repeated analysis
- Use category checks for fast filtering
- Avoid reparsing bytecode unnecessarily

## Notes

- Gas costs are base values; actual costs may be higher
- Some opcodes have dynamic gas (SSTORE, CALL, etc.)
- Stack has 1024 item limit (not enforced by these utilities)
- Includes EIP-3074 (AUTH/AUTHCALL) and recent opcodes
- Immediate data in PUSH instructions affects bytecode length
