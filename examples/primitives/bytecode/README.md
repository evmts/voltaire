# Bytecode Examples

Comprehensive examples demonstrating the Bytecode primitive in both TypeScript and Zig.

## Overview

The Bytecode primitive provides robust tools for analyzing, validating, and manipulating EVM bytecode. These examples cover all major functionality from basic usage to advanced contract analysis.

## Examples

### 1. Basic Usage (`basic-usage.ts`, `basic-usage.zig`)

**Demonstrates:**
- Creating bytecode from hex strings and Uint8Array
- Converting between formats (hex, bytes)
- Basic validation
- Size and equality operations
- Common opcode constants
- Safe parsing patterns

**Key concepts:**
- Bytecode construction from different sources
- Format conversions with and without `0x` prefix
- Validation catches incomplete PUSH instructions
- Type-safe bytecode operations

**Run:**
```bash
# TypeScript
bun run examples/primitives/bytecode/basic-usage.ts

# Zig
zig build && ./zig-out/bin/example-bytecode-basic-usage
```

---

### 2. Bytecode Analysis (`bytecode-analysis.ts`, `bytecode-analysis.zig`)

**Demonstrates:**
- Complete bytecode analysis (`analyze()`)
- Jump destination analysis (`analyzeJumpDestinations()`)
- Instruction parsing with PUSH data
- Opcode utilities (`isPush`, `getPushSize`, `isTerminator`)
- Extracting PUSH values
- Counting instruction types

**Key concepts:**
- Why jump destination analysis must skip PUSH data
- Distinguishing between JUMPDEST opcodes and 0x5b bytes in PUSH data
- Parsing instructions with position tracking
- Classifying opcodes by type

**Run:**
```bash
# TypeScript
bun run examples/primitives/bytecode/bytecode-analysis.ts

# Zig
zig build && ./zig-out/bin/example-bytecode-analysis
```

---

### 3. Disassembly (`disassembly.ts`, `disassembly.zig`)

**Demonstrates:**
- Formatting bytecode as human-readable instructions
- Formatting individual instructions
- Annotated disassembly with jump targets
- Side-by-side hex and disassembly comparison
- Disassembly with PUSH value decoding
- Grouped disassembly by basic blocks
- Compact and export formats

**Key concepts:**
- Converting opcodes to mnemonics
- Displaying PUSH data inline
- Annotating jump destinations and terminators
- Different disassembly output formats

**Run:**
```bash
# TypeScript
bun run examples/primitives/bytecode/disassembly.ts

# Zig
zig build && ./zig-out/bin/example-bytecode-disassembly
```

---

### 4. Metadata Handling (`metadata-handling.ts`, `metadata-handling.zig`)

**Demonstrates:**
- Detecting Solidity compiler metadata
- Stripping metadata from bytecode
- Comparing bytecode without metadata
- Extracting metadata sections
- Analyzing metadata size and presence
- Contract verification patterns
- Metadata caching for performance

**Key concepts:**
- Solidity appends CBOR-encoded metadata to deployed bytecode
- Different compilations of identical source produce different metadata
- Strip metadata before comparing bytecode
- Metadata detection is heuristic-based (rare false positives possible)

**Run:**
```bash
# TypeScript
bun run examples/primitives/bytecode/metadata-handling.ts

# Zig
zig build && ./zig-out/bin/example-bytecode-metadata
```

---

### 5. Validation (`validation.ts`, `validation.zig`)

**Demonstrates:**
- Validating bytecode structure
- Detecting incomplete PUSH instructions
- Testing all PUSH sizes (PUSH1-PUSH32)
- Truncated bytecode detection
- Safe parsing patterns
- Validation before analysis
- Edge cases and semantic vs structural validation
- Batch validation

**Key concepts:**
- `validate()` checks structure, not semantics
- Catches incomplete PUSH instructions
- Does NOT catch stack underflow, invalid opcodes, or unreachable code
- Empty bytecode is valid
- Single-pass O(n) validation

**Run:**
```bash
# TypeScript
bun run examples/primitives/bytecode/validation.ts

# Zig
zig build && ./zig-out/bin/example-bytecode-validation
```

---

### 6. Contract Deployment (`contract-deployment.ts`, `contract-deployment.zig`)

**Demonstrates:**
- Analyzing contract creation bytecode
- Analyzing deployed runtime bytecode
- Comparing creation vs runtime code
- Extracting constructor arguments
- Verifying deployed contracts
- Finding function selectors (PUSH4 patterns)
- Constructor pattern detection
- Size optimization analysis

**Key concepts:**
- Creation bytecode = constructor + runtime code
- Runtime bytecode is stored on-chain
- Constructor arguments appended to creation bytecode
- Function selectors are 4-byte PUSH4 values
- Metadata varies between compilations

**Run:**
```bash
# TypeScript
bun run examples/primitives/bytecode/contract-deployment.ts

# Zig
zig build && ./zig-out/bin/example-bytecode-deployment
```

---

## Example Coverage

| Feature | Examples |
|---------|----------|
| **Constructors** | basic-usage |
| **Conversions** | basic-usage |
| **Validation** | basic-usage, validation |
| **Analysis** | bytecode-analysis |
| **Jump destinations** | bytecode-analysis |
| **Instruction parsing** | bytecode-analysis, disassembly |
| **Disassembly** | disassembly |
| **Metadata** | metadata-handling, contract-deployment |
| **Formatting** | disassembly |
| **Utilities** | basic-usage, validation |
| **Contract analysis** | contract-deployment |

## Key Concepts

### PUSH Data Handling

**Critical:** Bytes following PUSH1-PUSH32 opcodes are data, not opcodes. Analysis must skip this data:

```typescript
// ❌ WRONG - treats PUSH data as opcodes
for (let i = 0; i < bytecode.length; i++) {
  const opcode = bytecode[i];
  // This will incorrectly process PUSH data bytes as opcodes!
}

// ✓ CORRECT - skips PUSH data
const instructions = Bytecode.parseInstructions(bytecode);
for (const inst of instructions) {
  // inst.opcode is the actual opcode
  // inst.pushData contains the data (if PUSH instruction)
}
```

### Jump Destination Analysis

Example demonstrating why proper parsing matters:

```
Bytecode: 0x605b5b
         ^^^^^^  ^^
         |    |  Actual JUMPDEST at position 2
         |    0x5b byte (PUSH1 data, NOT a JUMPDEST)
         PUSH1 opcode

analyzeJumpDestinations(0x605b5b) returns Set([2])
// Only position 2 is a valid jump target
```

### Validation Scope

**What `validate()` checks:**
- ✓ PUSH instructions have required data bytes
- ✓ Bytecode can be fully parsed
- ✓ No truncated instructions

**What `validate()` does NOT check:**
- ✗ Opcode validity (all 0x00-0xFF accepted)
- ✗ Stack depth or gas usage
- ✗ Jump destination reachability
- ✗ Semantic correctness

### Metadata Detection

Solidity compiler appends metadata:
```
[bytecode][metadata_content][0x00][length_byte]
                              ^^^^^^^^^^^^^^^^
                              Metadata length marker
```

Example:
```
0x6001...a264...0033
          ^^^^...^^^^  Metadata content (CBOR-encoded)
                 ^^^^  Length: 0x00 0x33 (51 bytes)
```

## Running All Examples

**TypeScript:**
```bash
for f in examples/primitives/bytecode/*.ts; do
  echo "=== Running $f ==="
  bun run "$f"
done
```

**Zig:**
```bash
zig build
for f in zig-out/bin/example-bytecode-*; do
  echo "=== Running $f ==="
  "$f"
done
```

## Documentation

For detailed API documentation, see:
- [Bytecode Overview](/src/content/docs/primitives/bytecode/index.mdx)
- [Constructors](/src/content/docs/primitives/bytecode/constructors.mdx)
- [Conversions](/src/content/docs/primitives/bytecode/conversions.mdx)
- [Validation](/src/content/docs/primitives/bytecode/validation.mdx)
- [Analysis](/src/content/docs/primitives/bytecode/analysis.mdx)
- [Formatting](/src/content/docs/primitives/bytecode/formatting.mdx)
- [Metadata](/src/content/docs/primitives/bytecode/metadata.mdx)

## Related Examples

- [Address Examples](/examples/primitives/address/) - EVM address handling
- [Hash Examples](/examples/primitives/hash/) - Keccak-256 hashing
- [Hex Examples](/examples/primitives/hex/) - Hex string utilities
- [Transaction Examples](/examples/primitives/transaction/) - Transaction encoding/decoding
