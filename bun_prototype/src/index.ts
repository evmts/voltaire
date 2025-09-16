#!/usr/bin/env bun
/**
 * Guillotine Bun EVM Prototype
 * 
 * A TypeScript/Bun implementation of the EVM for rapid prototyping
 * and comparison with the Zig implementation.
 */

import { createEvm } from './evm/evm';
import { createForkedStorage } from './storage/forked-storage';
import { createMemoryStorage } from './storage/memory-storage';

export * from './evm/evm';
export * from './storage/forked-storage';
export * from './storage/memory-storage';
export * from './storage/types';

// Example usage
async function main() {
  console.log('🔪 Guillotine Bun EVM Prototype');
  console.log('================================\n');

  // Create storage backend
  const storage = createMemoryStorage();
  
  // Or use forked storage
  // const storage = await createForkedStorage({
  //   rpcUrl: 'https://rpc.ankr.com/eth',
  //   blockNumber: 18_000_000n,
  // });

  // Create EVM instance
  const evm = createEvm({
    storage,
    chainId: 1n,
    blockNumber: 1n,
    timestamp: BigInt(Date.now()),
    gasLimit: 30_000_000n,
  });

  console.log('✅ EVM initialized');
  console.log(`Chain ID: ${evm.chainId}`);
  console.log(`Block: ${evm.blockNumber}`);
  
  // Example: Execute a simple transaction
  // const result = await evm.execute({
  //   from: '0x...',
  //   to: '0x...',
  //   data: '0x...',
  //   gas: 100_000n,
  // });
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error);
}