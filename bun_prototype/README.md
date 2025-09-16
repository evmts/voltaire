# Guillotine Bun EVM Prototype

A TypeScript/Bun implementation of the Ethereum Virtual Machine for rapid prototyping and testing.

## Overview

This prototype serves as:
1. A testing ground for EVM features before implementing in Zig
2. A reference implementation for complex state management
3. A tool for differential testing against the Zig implementation

## Structure

```
bun_prototype/
├── src/
│   ├── evm/           # EVM core implementation
│   │   └── evm.ts     # Main EVM class
│   ├── storage/       # Storage backends
│   │   ├── types.ts   # Storage interfaces
│   │   ├── memory-storage.ts  # In-memory storage
│   │   ├── forked-storage.ts  # Fork mode with RPC
│   │   └── reference/ # Original Tevm reference implementation
│   └── index.ts       # Main entry point
├── test/              # Tests
├── bench/             # Benchmarks
├── package.json
└── tsconfig.json
```

## Installation

```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Install dependencies
cd bun_prototype
bun install
```

## Usage

### Basic EVM

```typescript
import { createEvm, createMemoryStorage } from '@guillotine/bun-evm-prototype';

// Create in-memory storage
const storage = createMemoryStorage();

// Initialize EVM
const evm = createEvm({
  storage,
  chainId: 1n,
  blockNumber: 18_000_000n,
  timestamp: BigInt(Date.now()),
  gasLimit: 30_000_000n,
});

// Execute a transaction
const result = await evm.execute({
  from: '0x...',
  to: '0x...',
  data: '0x...',
  gas: 100_000n,
});
```

### Fork Mode

```typescript
import { createForkedStorage } from '@guillotine/bun-evm-prototype';

// Create forked storage from mainnet
const storage = await createForkedStorage({
  rpcUrl: 'https://rpc.ankr.com/eth',
  blockNumber: 18_000_000n,
});

// Use with EVM as normal
const evm = createEvm({ storage, /* ... */ });

// Access mainnet state
const vitalikBalance = await storage.getBalance(
  Buffer.from('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'hex')
);
```

## Development

```bash
# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Type checking
bun run typecheck

# Run the prototype
bun run dev
```

## Features

### Implemented ✅
- [x] Storage interface with multiple backends
- [x] Memory storage backend
- [x] Forked storage with RPC client
- [x] Basic EVM structure
- [x] Three-tier cache system for fork mode

### TODO 📝
- [ ] Opcode implementation
- [ ] Gas metering
- [ ] Contract deployment
- [ ] Precompiles
- [ ] Transaction validation
- [ ] State journaling
- [ ] EIP implementations

## Reference Implementation

The `src/storage/reference/` directory contains the original Tevm implementation that serves as our reference for state management patterns. Key concepts:

- **BaseState**: Core state management
- **StateCache**: Multi-level caching
- **ForkOptions**: Fork mode configuration
- **Actions**: State manipulation operations

## Testing

The Bun prototype is designed for easy testing:

```typescript
// test/evm.test.ts
import { test, expect } from 'bun:test';
import { createEvm, createMemoryStorage } from '../src';

test('simple transfer', async () => {
  const storage = createMemoryStorage();
  const evm = createEvm({ storage, /* ... */ });
  
  // Set up initial state
  await storage.setAccount(senderAddress, {
    balance: 1000n,
    nonce: 0n,
    codeHash: new Uint8Array(32),
    storageRoot: new Uint8Array(32),
  });
  
  // Execute transfer
  const result = await evm.execute({
    from: sender,
    to: receiver,
    value: 100n,
    gas: 21000n,
  });
  
  expect(result.success).toBe(true);
  expect(await storage.getBalance(receiverAddress)).toBe(100n);
});
```

## Performance

Bun provides excellent performance for a JavaScript runtime:
- Fast startup time
- Native TypeScript support
- Efficient FFI for native extensions
- Built-in test runner and bundler

## Integration with Zig Implementation

This prototype can be used for:

1. **Differential Testing**: Compare outputs between Bun and Zig implementations
2. **Rapid Prototyping**: Test new features quickly before Zig implementation
3. **Debugging**: Easier to debug complex state issues in TypeScript
4. **Documentation**: Serve as readable reference for complex algorithms

## License

Same as main Guillotine project