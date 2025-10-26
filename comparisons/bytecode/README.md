# EVM Bytecode Analysis Benchmarks

This directory contains comprehensive benchmarks comparing EVM bytecode analysis functions across guil, ethers, and viem.

## Important Note

**All bytecode analysis functions are guil-exclusive features.** Neither ethers nor viem provide low-level bytecode analysis utilities, as they focus on higher-level interactions with the Ethereum network.

## Functions Benchmarked

### 1. analyzeJumpDestinations

Analyzes EVM bytecode to find all valid JUMPDEST instructions.

- **Path**: `./analyzeJumpDestinations/`
- **Test Data**: Simple, complex, and large bytecode samples
- **Purpose**: Identifies valid jump targets for EVM execution

### 2. validateBytecode

Validates the structural integrity of EVM bytecode.

- **Path**: `./validateBytecode/`
- **Test Data**: Valid and invalid bytecode (truncated PUSH instructions)
- **Purpose**: Ensures bytecode is well-formed before execution

### 3. isBytecodeBoundary

Checks if a position in bytecode is at an opcode boundary.

- **Path**: `./isBytecodeBoundary/`
- **Test Data**: Various positions in bytecode with PUSH operations
- **Purpose**: Determines if a position is a valid instruction start

### 4. isValidJumpDest

Validates if a position is a valid JUMPDEST instruction.

- **Path**: `./isValidJumpDest/`
- **Test Data**: Valid JUMPDESTs, invalid positions, and JUMPDEST in PUSH data
- **Purpose**: Validates jump targets for EVM execution safety

## Test Data

All benchmarks use realistic EVM bytecode examples defined in `test-data.ts`:

- **SIMPLE_BYTECODE**: Basic contract with JUMPDEST instructions
- **COMPLEX_BYTECODE**: Contract with multiple PUSH operations (PUSH1, PUSH2, PUSH32)
- **LARGE_BYTECODE**: Realistic contract deployment bytecode
- **INVALID_JUMPDEST_BYTECODE**: Bytecode with JUMPDEST in PUSH data
- **TRUNCATED_PUSH**: Invalid bytecode for validation testing

## Running Benchmarks

```bash
# Run all bytecode benchmarks
npm run bench comparisons/bytecode

# Run specific function benchmark
npm run bench comparisons/bytecode/analyzeJumpDestinations
npm run bench comparisons/bytecode/validateBytecode
npm run bench comparisons/bytecode/isBytecodeBoundary
npm run bench comparisons/bytecode/isValidJumpDest
```

## Generate Documentation

```bash
# Generate comprehensive documentation for all bytecode functions
npx tsx comparisons/bytecode/docs.ts
```

## Use Cases

These bytecode analysis functions are essential for:

- **EVM Execution Engines**: Validating jump targets before execution
- **Debuggers**: Identifying instruction boundaries for breakpoints
- **Disassemblers**: Converting bytecode to human-readable assembly
- **Security Analysis**: Detecting malformed or potentially malicious bytecode
- **Gas Estimation**: Accurately analyzing execution paths

## Why guil?

While ethers and viem are excellent for interacting with the Ethereum network, they don't provide low-level bytecode analysis utilities. Guil fills this gap by offering:

- **Comprehensive bytecode analysis**: All functions needed for EVM execution
- **Correct PUSH handling**: Properly skips PUSH instruction data (PUSH1-PUSH32)
- **Performance**: Optimized single-pass algorithms for large bytecode
- **Type safety**: Full TypeScript support with proper type definitions
- **Dual input support**: Works with both Uint8Array and hex strings

## EVM Bytecode Primer

### JUMPDEST (0x5b)

The JUMPDEST opcode marks valid jump destinations in EVM bytecode. JUMP and JUMPI instructions can only target positions containing JUMPDEST. Crucially, a JUMPDEST byte within PUSH instruction data is NOT a valid jump destination.

### PUSH Instructions (0x60-0x7f)

PUSH instructions (PUSH1 through PUSH32) are followed by 1-32 bytes of immediate data. This data is part of the instruction and must be skipped when analyzing bytecode structure.

Example:
```
0x60 0x5b     # PUSH1 0x5b - The 0x5b is data, not a JUMPDEST
0x5b          # JUMPDEST - This IS a valid jump destination
```

### Bytecode Boundaries

A "bytecode boundary" is a position where an instruction begins. Positions within PUSH instruction data are not boundaries and cannot be valid jump targets.

## Implementation Details

All guil implementations:

1. Handle both Uint8Array and hex string inputs
2. Correctly parse PUSH1-PUSH32 instructions
3. Skip PUSH instruction data when analyzing
4. Use single-pass algorithms for efficiency
5. Return early on invalid inputs

## Performance Characteristics

- **analyzeJumpDestinations**: O(n) single pass through bytecode
- **validateBytecode**: O(n) single pass with bounds checking
- **isBytecodeBoundary**: O(n) worst case (position near end)
- **isValidJumpDest**: O(n) worst case (combines boundary check + opcode check)

Where n is the bytecode length in bytes.
