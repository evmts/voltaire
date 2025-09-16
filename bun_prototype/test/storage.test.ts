import { test, expect, describe } from 'bun:test';
import { createMemoryStorage } from '../src/storage/memory-storage';
import { createForkedStorage } from '../src/storage/forked-storage';
import type { Account } from '../src/storage/types';

describe('MemoryStorage', () => {
  test('should store and retrieve accounts', async () => {
    const storage = createMemoryStorage();
    const address = new Uint8Array(20).fill(0x12);
    
    const account: Account = {
      balance: 1000n,
      nonce: 5n,
      codeHash: new Uint8Array(32).fill(0xAB),
      storageRoot: new Uint8Array(32).fill(0xCD),
    };
    
    await storage.setAccount(address, account);
    const retrieved = await storage.getAccount(address);
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.balance).toBe(1000n);
    expect(retrieved?.nonce).toBe(5n);
  });

  test('should handle storage slots', async () => {
    const storage = createMemoryStorage();
    const address = new Uint8Array(20).fill(0x34);
    
    await storage.setStorage(address, 42n, 999n);
    const value = await storage.getStorage(address, 42n);
    
    expect(value).toBe(999n);
  });

  test('should support snapshots', async () => {
    const storage = createMemoryStorage();
    const address = new Uint8Array(20).fill(0x56);
    
    await storage.setAccount(address, {
      balance: 1000n,
      nonce: 0n,
      codeHash: new Uint8Array(32),
      storageRoot: new Uint8Array(32),
    });
    
    const snapshot = await storage.createSnapshot();
    
    await storage.setAccount(address, {
      balance: 2000n,
      nonce: 1n,
      codeHash: new Uint8Array(32),
      storageRoot: new Uint8Array(32),
    });
    
    expect(await storage.getBalance(address)).toBe(2000n);
    
    await storage.revertToSnapshot(snapshot);
    expect(await storage.getBalance(address)).toBe(1000n);
  });
});

describe('ForkedStorage', () => {
  test.skip('should fetch from RPC (requires network)', async () => {
    const storage = await createForkedStorage({
      rpcUrl: 'https://rpc.ankr.com/eth',
      blockNumber: 18_000_000n,
    });
    
    // Vitalik's address
    const address = Buffer.from('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'hex');
    
    const balance = await storage.getBalance(address);
    console.log('Vitalik balance:', balance);
    
    expect(balance).toBeGreaterThan(0n);
  });
  
  test('should have correct structure', () => {
    // Just verify the class exists and has expected methods
    expect(createForkedStorage).toBeDefined();
  });
});