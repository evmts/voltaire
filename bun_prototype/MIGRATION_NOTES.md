# Migration Notes: Reference Implementation → Bun Prototype

## What Was Moved

The TypeScript/JavaScript reference implementation from `src/storage/reference/` has been moved to `bun_prototype/src/storage/reference/`.

## Project Structure

```
bun_prototype/
├── src/
│   ├── evm/                    # New EVM implementation
│   │   └── evm.ts              # Main EVM class
│   ├── storage/                
│   │   ├── types.ts            # Storage interfaces
│   │   ├── memory-storage.ts   # In-memory storage
│   │   ├── forked-storage.ts   # Fork mode with RPC
│   │   └── reference/          # Original Tevm implementation (moved here)
│   │       ├── BaseState.ts
│   │       ├── StateManager.ts
│   │       ├── actions/        # State manipulation operations
│   │       └── state-types/    # Type definitions
│   └── index.ts                # Main entry point
├── test/
│   └── storage.test.ts         # Storage tests
├── package.json                # Bun project configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Documentation
```

## Key Changes

### 1. **Package Management**
- Now uses Bun instead of Node.js
- `package.json` configured for Bun runtime
- TypeScript runs natively without compilation

### 2. **New Storage Implementations**
Created simplified, clean implementations alongside the reference:
- `memory-storage.ts` - Clean in-memory storage
- `forked-storage.ts` - RPC-backed fork mode
- `types.ts` - Unified storage interface

### 3. **EVM Skeleton**
- `evm.ts` - Basic EVM structure ready for implementation
- Designed to work with any storage backend
- Prepared for differential testing with Zig implementation

## How to Use

### Install Dependencies
```bash
cd bun_prototype
bun install
```

### Run Tests
```bash
# All tests
bun test

# Specific test file
bun test test/storage.test.ts
```

### Run the Prototype
```bash
bun run src/index.ts
```

### Development
```bash
# Watch mode for tests
bun test --watch

# Type checking
bun run typecheck
```

## Benefits of Bun

1. **Speed**: Faster than Node.js for development
2. **TypeScript**: Native support, no build step
3. **Testing**: Built-in test runner
4. **FFI**: Easy integration with native code if needed
5. **Compatibility**: Works with existing npm packages

## Next Steps

1. **Implement Opcodes**: Port opcode implementations from Zig
2. **Differential Testing**: Compare outputs between Bun and Zig
3. **Performance Benchmarks**: Measure speed differences
4. **Feature Parity**: Implement missing EVM features

## Reference Implementation Status

The original Tevm implementation in `src/storage/reference/` includes:
- ✅ Complete state management
- ✅ Fork mode support
- ✅ Multi-level caching
- ✅ Merkle proof generation
- ⚠️ Some tests failing due to mock differences
- ⚠️ Uses Vitest mocks that need adaptation for Bun

## Integration with Zig

The Bun prototype serves as:
1. A reference for complex algorithms
2. A tool for rapid prototyping
3. A differential testing harness
4. Documentation through working code

The storage interface matches the Zig implementation, making it easy to compare behaviors and ensure correctness.