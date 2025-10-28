# Bytecode

EVM bytecode analysis and manipulation utilities.

## Overview

EVM bytecode is the low-level compiled form of smart contract code that executes on the Ethereum Virtual Machine. This module provides utilities for analyzing, validating, parsing, and formatting bytecode.

**Key Features:**
- Jump destination analysis (JUMPDEST validation)
- Bytecode validation (incomplete PUSH detection)
- Instruction parsing and disassembly
- Metadata detection and stripping
- Hex conversion utilities

**When to Use:**
- Analyzing deployed contract bytecode
- Validating bytecode structure
- Disassembling bytecode for debugging
- Identifying valid jump destinations
- Stripping compiler metadata

## Quick Start

```typescript
import { Bytecode } from '@tevm/voltaire';

// Parse hex bytecode
const code = Bytecode.fromHex('0x60016002015b00');

// Analyze bytecode
const analysis = Bytecode.analyze(code);
console.log(`Valid: ${analysis.valid}`);
console.log(`Instructions: ${analysis.instructions.length}`);
console.log(`Jump destinations: ${analysis.jumpDestinations.size}`);

// Disassemble
const disassembly = Bytecode.disassemble.call(code);
disassembly.forEach(line => console.log(line));
```

## Opcode Constants

```typescript
Bytecode.JUMPDEST = 0x5b;   // Jump destination marker
Bytecode.PUSH1 = 0x60;      // PUSH1 opcode
Bytecode.PUSH32 = 0x7f;     // PUSH32 opcode
Bytecode.STOP = 0x00;       // STOP opcode
Bytecode.RETURN = 0xf3;     // RETURN opcode
Bytecode.REVERT = 0xfd;     // REVERT opcode
Bytecode.INVALID = 0xfe;    // INVALID opcode
```

## Core Types

### Bytecode

Main type representing EVM bytecode.

```typescript
type Bytecode = Uint8Array;
```

### Bytecode.Opcode

Single byte instruction.

```typescript
type Opcode = number;
```

### Bytecode.Instruction

Parsed bytecode instruction with position and optional PUSH data.

```typescript
type Instruction = {
  opcode: Opcode;           // Opcode byte
  position: number;         // Position in bytecode
  pushData?: Uint8Array;    // Data for PUSH instructions
};
```

### Bytecode.Analysis

Complete bytecode analysis result.

```typescript
type Analysis = {
  jumpDestinations: ReadonlySet<number>;  // Valid JUMPDEST positions
  instructions: readonly Instruction[];   // All instructions
  valid: boolean;                         // Whether bytecode is valid
};
```

## Opcode Utilities

### isPush

Check if opcode is PUSH instruction (PUSH1-PUSH32).

```typescript
Bytecode.isPush(opcode: Opcode): boolean
```

```typescript
Bytecode.isPush(0x60); // true (PUSH1)
Bytecode.isPush(0x7f); // true (PUSH32)
Bytecode.isPush(0x00); // false
```

### getPushSize

Get number of bytes pushed by PUSH instruction.

```typescript
Bytecode.getPushSize(opcode: Opcode): number
```

```typescript
Bytecode.getPushSize(0x60); // 1 (PUSH1)
Bytecode.getPushSize(0x7f); // 32 (PUSH32)
Bytecode.getPushSize(0x00); // 0 (not a PUSH)
```

### isTerminator

Check if opcode terminates execution.

```typescript
Bytecode.isTerminator(opcode: Opcode): boolean
```

```typescript
Bytecode.isTerminator(0x00); // true (STOP)
Bytecode.isTerminator(0xf3); // true (RETURN)
Bytecode.isTerminator(0xfd); // true (REVERT)
Bytecode.isTerminator(0xfe); // true (INVALID)
```

## Jump Destination Analysis

### analyzeJumpDestinations

Identify all valid JUMPDEST positions, skipping PUSH data.

```typescript
Bytecode.analyzeJumpDestinations(code: Uint8Array): Set<number>
Bytecode.analyzeJumpDests.call(this: Uint8Array): Set<number>
```

```typescript
const code = Bytecode.fromHex('0x605b5b'); // PUSH1 0x5b, JUMPDEST
const jumpdests = Bytecode.analyzeJumpDestinations(code);

jumpdests.has(1); // false (inside PUSH data)
jumpdests.has(2); // true (actual JUMPDEST)
```

**Critical:** This correctly skips bytes inside PUSH instruction data to avoid treating data bytes as opcodes.

### isValidJumpDest

Check if position is a valid JUMPDEST.

```typescript
Bytecode.isValidJumpDest(code: Uint8Array, position: number): boolean
Bytecode.isJumpDest.call(this: Uint8Array, position: number): boolean
```

```typescript
const code = Bytecode.fromHex('0x5b60005b');
Bytecode.isValidJumpDest(code, 0); // true
Bytecode.isValidJumpDest(code, 3); // true
Bytecode.isValidJumpDest(code, 1); // false (not a JUMPDEST)
```

## Validation

### validate

Validate bytecode structure.

```typescript
Bytecode.validate(code: Uint8Array): boolean
Bytecode.isValid.call(this: Uint8Array): boolean
```

```typescript
// Valid bytecode
const valid = Bytecode.fromHex('0x6001'); // PUSH1 0x01
Bytecode.validate(valid); // true

// Invalid bytecode (incomplete PUSH)
const invalid = Bytecode.fromHex('0x60'); // PUSH1 with no data
Bytecode.validate(invalid); // false
```

**Checks:**
- Incomplete PUSH instructions
- Bytecode can be fully parsed

## Instruction Parsing

### parseInstructions

Parse bytecode into instruction array.

```typescript
Bytecode.parseInstructions(code: Uint8Array): Instruction[]
Bytecode.parse.call(this: Uint8Array): Instruction[]
```

```typescript
const code = Bytecode.fromHex('0x600160020155b');
const instructions = Bytecode.parseInstructions(code);

// [
//   { opcode: 0x60, position: 0, pushData: Uint8Array([0x01]) },
//   { opcode: 0x60, position: 2, pushData: Uint8Array([0x02]) },
//   { opcode: 0x01, position: 4 },
//   { opcode: 0x5b, position: 5 }
// ]
```

## Complete Analysis

### analyze

Perform complete bytecode analysis.

```typescript
Bytecode.analyze(code: Uint8Array): Analysis
Bytecode.getAnalysis.call(this: Uint8Array): Analysis
```

```typescript
const code = Bytecode.fromHex('0x600160025b00');
const analysis = Bytecode.analyze(code);

console.log(`Valid: ${analysis.valid}`);
console.log(`Jump destinations: ${analysis.jumpDestinations.size}`);
console.log(`Instructions: ${analysis.instructions.length}`);

if (analysis.jumpDestinations.has(4)) {
  console.log('JUMPDEST at position 4');
}
```

## Size Operations

### size

Get bytecode size in bytes.

```typescript
Bytecode.size(code: Uint8Array): number
Bytecode.getSize.call(this: Uint8Array): number
```

```typescript
const code = Bytecode.fromHex('0x6001');
Bytecode.size(code); // 2
```

### extractRuntime

Extract runtime bytecode from creation bytecode.

```typescript
Bytecode.extractRuntime(code: Uint8Array, offset: number): Uint8Array
Bytecode.getRuntime.call(this: Uint8Array, offset: number): Uint8Array
```

```typescript
// Creation bytecode contains constructor + runtime
const creation = Bytecode.fromHex('0x60806040...'); // Full creation code
const runtimeOffset = 42; // Where runtime code starts

const runtime = Bytecode.extractRuntime(creation, runtimeOffset);
```

## Comparison

### equals

Compare bytecode for equality.

```typescript
Bytecode.equals(a: Uint8Array, b: Uint8Array): boolean
Bytecode.isEqual.call(this: Uint8Array, other: Uint8Array): boolean
```

```typescript
const code1 = Bytecode.fromHex('0x6001');
const code2 = Bytecode.fromHex('0x6001');
const code3 = Bytecode.fromHex('0x6002');

Bytecode.equals(code1, code2); // true
Bytecode.equals(code1, code3); // false
```

## Hashing

### hash

Compute bytecode hash (keccak256).

**Status:** Not yet implemented

```typescript
Bytecode.hash(code: Uint8Array): Uint8Array
Bytecode.getHash.call(this: Uint8Array): Uint8Array
```

## Formatting

### toHex

Convert bytecode to hex string.

```typescript
Bytecode.toHex(code: Uint8Array, prefix?: boolean): string
Bytecode.asHex.call(this: Uint8Array, prefix?: boolean): string
```

```typescript
const code = new Uint8Array([0x60, 0x01]);
Bytecode.toHex(code);       // "0x6001"
Bytecode.toHex(code, false); // "6001"
```

### fromHex

Parse hex string to bytecode.

```typescript
Bytecode.fromHex(hex: string): Uint8Array
```

```typescript
const code = Bytecode.fromHex('0x6001');
const code2 = Bytecode.fromHex('6001'); // Works without prefix

// Throws on invalid hex
Bytecode.fromHex('0x600'); // Error: odd length
```

### formatInstruction

Format single instruction to human-readable string.

```typescript
Bytecode.formatInstruction(instruction: Instruction): string
```

```typescript
const inst = { opcode: 0x60, position: 0, pushData: new Uint8Array([0x01]) };
Bytecode.formatInstruction(inst); // "0x0000: PUSH1 0x01"
```

### formatInstructions

Format all instructions (disassemble).

```typescript
Bytecode.formatInstructions(code: Uint8Array): string[]
Bytecode.disassemble.call(this: Uint8Array): string[]
```

```typescript
const code = Bytecode.fromHex('0x600160025b00');
const disassembly = Bytecode.formatInstructions(code);

// [
//   "0x0000: PUSH1 0x01",
//   "0x0002: PUSH1 0x02",
//   "0x0004: 0x5B",
//   "0x0005: 0x00"
// ]
```

## Metadata Operations

### hasMetadata

Check if bytecode contains Solidity CBOR metadata.

```typescript
Bytecode.hasMetadata(code: Uint8Array): boolean
Bytecode.containsMetadata.call(this: Uint8Array): boolean
```

```typescript
const withMetadata = Bytecode.fromHex('0x6001...00a264'); // Ends with metadata marker
Bytecode.hasMetadata(withMetadata); // true

const withoutMetadata = Bytecode.fromHex('0x6001');
Bytecode.hasMetadata(withoutMetadata); // false
```

**Detection:** Looks for metadata length marker (`0x00 0x20-0x40`) at end of bytecode.

### stripMetadata

Remove Solidity metadata from bytecode.

```typescript
Bytecode.stripMetadata(code: Uint8Array): Uint8Array
Bytecode.withoutMetadata.call(this: Uint8Array): Uint8Array
```

```typescript
const withMetadata = Bytecode.fromHex('0x6001...00a264'); // With metadata
const stripped = Bytecode.stripMetadata(withMetadata);

// Returns bytecode without metadata section
Bytecode.hasMetadata(stripped); // false
```

**Use Case:** Comparing deployed bytecode when metadata varies (different compiler versions, source paths).

## Common Patterns

### Analyzing Deployed Code

```typescript
// Fetch and analyze deployed contract
const deployedCode = await eth.getCode(contractAddress);
const code = Bytecode.fromHex(deployedCode);

// Perform analysis
const analysis = Bytecode.analyze(code);

if (!analysis.valid) {
  console.error('Invalid bytecode detected');
  return;
}

console.log(`Contract has ${analysis.instructions.length} instructions`);
console.log(`Found ${analysis.jumpDestinations.size} jump destinations`);

// Check specific features
const hasMetadata = Bytecode.hasMetadata(code);
console.log(`Compiler metadata: ${hasMetadata ? 'present' : 'absent'}`);
```

### Disassembling Bytecode

```typescript
function disassembleContract(hexCode: string): void {
  const code = Bytecode.fromHex(hexCode);
  const disassembly = Bytecode.disassemble.call(code);

  console.log('Disassembly:');
  disassembly.forEach(line => console.log(line));
}

// Usage
disassembleContract('0x60016002015b00');
// Output:
// 0x0000: PUSH1 0x01
// 0x0002: PUSH1 0x02
// 0x0004: 0x01
// 0x0005: 0x5B
// 0x0006: 0x00
```

### Validating Jump Destinations

```typescript
function validateJump(code: Uint8Array, jumpTarget: number): boolean {
  // Check if jump target is valid JUMPDEST
  if (!Bytecode.isValidJumpDest(code, jumpTarget)) {
    console.error(`Invalid jump to 0x${jumpTarget.toString(16)}`);
    return false;
  }

  console.log(`Valid jump destination at 0x${jumpTarget.toString(16)}`);
  return true;
}

const code = Bytecode.fromHex('0x5b60005b');
validateJump(code, 0); // Valid
validateJump(code, 3); // Valid
validateJump(code, 1); // Invalid
```

### Comparing Bytecode Without Metadata

```typescript
function compareContracts(code1: string, code2: string): boolean {
  const bytecode1 = Bytecode.stripMetadata(Bytecode.fromHex(code1));
  const bytecode2 = Bytecode.stripMetadata(Bytecode.fromHex(code2));

  return Bytecode.equals(bytecode1, bytecode2);
}

// Compare contracts ignoring metadata differences
const contract1 = '0x6001...a264...0033'; // With metadata
const contract2 = '0x6001...a165...0029'; // Same code, different metadata

if (compareContracts(contract1, contract2)) {
  console.log('Contracts have identical code (ignoring metadata)');
}
```

### Extracting Runtime Code

```typescript
function analyzeCreationCode(creationHex: string): void {
  const creation = Bytecode.fromHex(creationHex);
  const analysis = Bytecode.analyze(creation);

  // Find RETURN instruction (typically returns runtime code)
  const returnInst = analysis.instructions.find(
    inst => inst.opcode === Bytecode.RETURN
  );

  if (returnInst) {
    console.log(`Constructor returns at position ${returnInst.position}`);

    // In real code, you'd parse the RETURN arguments to find runtime offset
    // This is simplified
    const runtimeOffset = 100; // Example
    const runtime = Bytecode.extractRuntime(creation, runtimeOffset);

    console.log(`Runtime code size: ${Bytecode.size(runtime)} bytes`);
  }
}
```

### Finding Instruction Patterns

```typescript
function findPushInstructions(code: Uint8Array): Bytecode.Instruction[] {
  const instructions = Bytecode.parseInstructions(code);

  return instructions.filter(inst => Bytecode.isPush(inst.opcode));
}

function findJumpDestinations(code: Uint8Array): number[] {
  const jumpdests = Bytecode.analyzeJumpDestinations(code);
  return Array.from(jumpdests).sort((a, b) => a - b);
}

// Usage
const code = Bytecode.fromHex('0x600160025b60035b');
const pushes = findPushInstructions(code);
console.log(`Found ${pushes.length} PUSH instructions`);

const jumpdests = findJumpDestinations(code);
console.log(`Jump destinations: ${jumpdests.join(', ')}`);
```

## Best Practices

### 1. Always Validate Before Analysis

```typescript
// Good: Validate first
const code = Bytecode.fromHex(hexCode);
if (!Bytecode.validate(code)) {
  throw new Error('Invalid bytecode');
}
const analysis = Bytecode.analyze(code);

// Bad: Assuming bytecode is valid
const analysis = Bytecode.analyze(code); // May have incomplete PUSH
```

### 2. Use analyzeJumpDestinations for Jump Validation

```typescript
// Good: Analyze once, check multiple times
const jumpdests = Bytecode.analyzeJumpDestinations(code);
if (jumpdests.has(target1)) { /* ... */ }
if (jumpdests.has(target2)) { /* ... */ }

// Bad: Re-analyzing for each check
if (Bytecode.isValidJumpDest(code, target1)) { /* ... */ } // Full re-analysis
if (Bytecode.isValidJumpDest(code, target2)) { /* ... */ } // Full re-analysis
```

### 3. Strip Metadata for Comparison

```typescript
// Good: Compare without metadata
const equal = Bytecode.equals(
  Bytecode.stripMetadata(code1),
  Bytecode.stripMetadata(code2)
);

// Bad: Direct comparison may fail due to metadata
const equal = Bytecode.equals(code1, code2); // False negative
```

### 4. Handle Hex Parsing Errors

```typescript
// Good: Validate hex input
try {
  const code = Bytecode.fromHex(userInput);
  processCode(code);
} catch (err) {
  console.error('Invalid hex string:', err.message);
}

// Bad: Assuming hex is valid
const code = Bytecode.fromHex(userInput); // May throw
```

### 5. Use Convenience Forms for Cleaner Code

```typescript
// Good: Fluent API
const analysis = Bytecode.analyze.call(code);
const hex = Bytecode.asHex.call(code);

// Also good: Standard form
const analysis = Bytecode.analyze(code);
const hex = Bytecode.toHex(code);
```

## Performance Considerations

### Operation Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| `validate` | O(n) | Single pass through bytecode |
| `analyzeJumpDestinations` | O(n) | Single pass, skips PUSH data |
| `isValidJumpDest` | O(n) | Calls analyzeJumpDestinations |
| `parseInstructions` | O(n) | Single pass with allocations |
| `analyze` | O(n) | Combines validation + parsing |
| `toHex` | O(n) | Array mapping |
| `fromHex` | O(n) | String parsing |
| `equals` | O(n) | Byte-by-byte comparison |
| `formatInstructions` | O(n) | Parsing + string formatting |
| `stripMetadata` | O(1) | Just slices array |

### Optimization Tips

1. **Cache analysis results** - Don't re-analyze same bytecode repeatedly
2. **Validate once** - Validation is separate from analysis
3. **Batch jump checks** - Use `analyzeJumpDestinations` once, check Set multiple times
4. **Avoid repeated hex conversion** - Cache hex strings
5. **Strip metadata once** - Do it before any comparisons

## Examples

### Simple Contract Bytecode

```typescript
// PUSH1 0x00, PUSH1 0x00, RETURN
const code = Bytecode.fromHex('0x60006000f3');

const analysis = Bytecode.analyze(code);
console.log(analysis);
// {
//   valid: true,
//   jumpDestinations: Set(0) {},
//   instructions: [
//     { opcode: 96, position: 0, pushData: Uint8Array([0]) },
//     { opcode: 96, position: 2, pushData: Uint8Array([0]) },
//     { opcode: 243, position: 4 }
//   ]
// }
```

### Code with Jump Destinations

```typescript
// PUSH1 0x05, JUMP, STOP, JUMPDEST, STOP
const code = Bytecode.fromHex('0x600556005b00');

const jumpdests = Bytecode.analyzeJumpDestinations(code);
console.log(Array.from(jumpdests)); // [4]

const disassembly = Bytecode.disassemble.call(code);
// [
//   "0x0000: PUSH1 0x05",
//   "0x0002: 0x56",
//   "0x0003: 0x00",
//   "0x0004: 0x5B",
//   "0x0005: 0x00"
// ]
```

### Metadata Handling

```typescript
// Bytecode with Solidity metadata
const withMetadata = Bytecode.fromHex(
  '0x6001' + 'a2'.repeat(49) + '0033'
);

console.log(Bytecode.hasMetadata(withMetadata)); // true

const stripped = Bytecode.stripMetadata(withMetadata);
console.log(Bytecode.toHex(stripped)); // "0x6001"
```

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - EVM specification
- [EVM Opcodes](https://www.evm.codes/) - Interactive opcode reference
- [Solidity Metadata](https://docs.soliditylang.org/en/latest/metadata.html) - Compiler metadata format

## API Summary

### Opcode Utilities
- `isPush(opcode)` - Check if PUSH instruction
- `getPushSize(opcode)` - Get PUSH data size
- `isTerminator(opcode)` - Check if terminates execution

### Jump Destination Analysis
- `analyzeJumpDestinations(code)` - Find all valid JUMPDESTs
- `isValidJumpDest(code, position)` - Check if position is valid JUMPDEST

### Validation
- `validate(code)` - Validate bytecode structure

### Instruction Parsing
- `parseInstructions(code)` - Parse into instruction array
- `analyze(code)` - Complete analysis

### Size Operations
- `size(code)` - Get bytecode size
- `extractRuntime(code, offset)` - Extract runtime portion

### Comparison
- `equals(a, b)` - Compare bytecode equality

### Hashing (Not Implemented)
- `hash(code)` - Compute keccak256 hash

### Formatting
- `toHex(code, prefix?)` - Convert to hex string
- `fromHex(hex)` - Parse hex string
- `formatInstruction(inst)` - Format instruction
- `formatInstructions(code)` - Disassemble bytecode

### Metadata Operations
- `hasMetadata(code)` - Check for metadata
- `stripMetadata(code)` - Remove metadata
