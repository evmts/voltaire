# Opcode.wasm.ts

WASM-accelerated opcode operations.

## Status

**WASM NOT IMPLEMENTED** - Pure TypeScript implementation already optimal.

## Why No WASM?

Opcode provides:
- Opcode enum (byte constants)
- Metadata lookups (getInfo, getName)
- Category checks (isPush, isDup, isSwap, isLog)
- Simple arithmetic (getPushBytes, getDupPosition)
- Bytecode parsing

These operations are:
- Already optimal in TypeScript
- Pure O(1) lookups, range checks, table access
- No heavy computation or data processing
- Execution time <200ns per operation

**WASM overhead (~1-2μs per call) would make operations 10-100x SLOWER.**

## Performance

Pure TypeScript benchmarks:
- isPush/isDup/isSwap/isLog: ~15-30ns (range check)
- getInfo: ~30-50ns (Map lookup)
- getName: ~40-60ns (Map lookup + property access)
- getPushBytes/getDupPosition: ~20-40ns (arithmetic)
- parseBytecode (100 bytes): ~5-10μs
- parseBytecode (1000 bytes): ~50-100μs
- disassemble (1000 bytes): ~100-200μs (string formatting)

**WASM would be 10-50x slower** for individual operations.

For bytecode parsing:
- Small (<100 bytes): TS faster (WASM overhead dominates)
- Large (>10KB): WASM might be 2-3x faster
- But large bytecode rare, 2-3x doesn't justify complexity

## API

```typescript
isWasmOpcodeAvailable(): boolean
```
Always returns false.

```typescript
getOpcodeImplementationStatus(): {
  available: boolean;
  reason: string;
  recommendation: string;
  performance: {
    typescriptAvg: string;
    wasmOverhead: string;
    verdict: string;
  };
  notes: string;
}
```
Returns implementation status and performance analysis.

## When to Use WASM

WASM is beneficial for:
- Heavy computation (>10μs)
- Cryptographic operations (hashing, signatures)
- Large data processing (RLP encoding, ABI encoding)
- Batch operations (processing many items)

Opcode does not fit these criteria.

## Usage

```typescript
import * as Opcode from './Opcode.wasm.ts';

// Uses pure TypeScript implementation
const info = Opcode.info(Opcode.ADD);

// Check availability
if (Opcode.isWasmOpcodeAvailable()) {
  // Never reaches here
} else {
  // Always uses pure TypeScript
}

// Get status
const status = Opcode.getOpcodeImplementationStatus();
console.log(status.reason);  // "Pure TS optimal - WASM overhead exceeds benefit"
```

## See Also

- [Opcode.js](./Opcode.js.md) - Pure TypeScript implementation
- [Address.wasm](../Address/Address.wasm.js.md) - WASM implementation pattern (where it makes sense)
