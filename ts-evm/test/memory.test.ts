import { describe, it, expect } from 'bun:test';
import {
  createMemory,
  ensureCapacity,
  setDataEvm,
  setByte,
  getSlice,
  getU256Evm,
  setU256,
  memoryCopy,
  memorySize,
  calculateMemoryCost,
  getExpansionCost
} from '../src/memory/memory';
import { u256, bytesToWord, wordToBytes32 } from '../src/types';

describe('Memory', () => {
  it('initializes with zero size', () => {
    const mem = createMemory();
    expect(memorySize(mem)).toBe(0);
    expect(mem.checkpoint).toBe(0);
  });

  it('expands capacity on demand', () => {
    const mem = createMemory();
    const err = ensureCapacity(mem, 64);
    expect(err).toBeUndefined();
    expect(memorySize(mem)).toBe(64);
    
    // Memory should be zero-initialized
    for (let i = 0; i < 64; i++) {
      expect(mem.buffer[i]).toBe(0);
    }
  });

  it('word-aligns memory expansion for setDataEvm', () => {
    const mem = createMemory();
    const data = new Uint8Array([1, 2, 3]);
    const err = setDataEvm(mem, 30, data); // 30 + 3 = 33, should align to 64
    expect(err).toBeUndefined();
    expect(memorySize(mem)).toBe(64);
  });

  it('sets and gets U256 values', () => {
    const mem = createMemory();
    const value = 0x1234567890abcdefn;
    
    const err = setU256(mem, 0, value);
    expect(err).toBeUndefined();
    
    const result = getU256Evm(mem, 0);
    expect(result).toBe(value);
  });

  it('handles setByte correctly', () => {
    const mem = createMemory();
    const err = setByte(mem, 10, 0xFF);
    expect(err).toBeUndefined();
    expect(memorySize(mem)).toBe(11); // Not word-aligned for single byte
    expect(mem.buffer[10]).toBe(0xFF);
  });

  it('returns zeros for out-of-bounds reads', () => {
    const mem = createMemory();
    ensureCapacity(mem, 32);
    
    const slice = getSlice(mem, 50, 10);
    expect(slice.length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(slice[i]).toBe(0);
    }
  });

  it('handles partial out-of-bounds reads', () => {
    const mem = createMemory();
    setDataEvm(mem, 0, new Uint8Array([1, 2, 3, 4]));
    
    const slice = getSlice(mem, 2, 5); // Read from offset 2, length 5
    expect(slice[0]).toBe(3);
    expect(slice[1]).toBe(4);
    expect(slice[2]).toBe(0); // Out of bounds
    expect(slice[3]).toBe(0);
    expect(slice[4]).toBe(0);
  });

  it('copies memory with overlapping regions', () => {
    const mem = createMemory();
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    setDataEvm(mem, 0, data);
    
    // Copy overlapping forward
    memoryCopy(mem, 2, 0, 3); // Copy [1,2,3] to offset 2
    expect(mem.buffer[2]).toBe(1);
    expect(mem.buffer[3]).toBe(2);
    expect(mem.buffer[4]).toBe(3);
  });

  it('copies memory with non-overlapping regions', () => {
    const mem = createMemory();
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    setDataEvm(mem, 0, data);
    
    memoryCopy(mem, 10, 0, 5);
    for (let i = 0; i < 5; i++) {
      expect(mem.buffer[10 + i]).toBe(i + 1);
    }
  });

  it('handles zero-length copies', () => {
    const mem = createMemory();
    const err = memoryCopy(mem, 100, 200, 0);
    expect(err).toBeUndefined();
    expect(memorySize(mem)).toBe(0); // No expansion for zero-length
  });

  it('calculates memory cost correctly', () => {
    // 1 word: 3 * 1 + 1²/512 = 3 + 0 = 3
    expect(calculateMemoryCost(1n)).toBe(3n);
    
    // 2 words: 3 * 2 + 2²/512 = 6 + 0 = 6
    expect(calculateMemoryCost(2n)).toBe(6n);
    
    // 512 words: 3 * 512 + 512²/512 = 1536 + 512 = 2048
    expect(calculateMemoryCost(512n)).toBe(2048n);
    
    // 1024 words: 3 * 1024 + 1024²/512 = 3072 + 2048 = 5120
    expect(calculateMemoryCost(1024n)).toBe(5120n);
  });

  it('calculates expansion cost correctly', () => {
    const mem = createMemory();
    
    // Initial expansion to 32 bytes (1 word)
    expect(getExpansionCost(mem, 32)).toBe(3n);
    ensureCapacity(mem, 32);
    
    // No cost for same size
    expect(getExpansionCost(mem, 32)).toBe(0n);
    
    // Expansion to 64 bytes (2 words): cost(2) - cost(1) = 6 - 3 = 3
    expect(getExpansionCost(mem, 64)).toBe(3n);
  });

  it('word-aligns expansion cost calculation', () => {
    const mem = createMemory();
    
    // 33 bytes rounds up to 2 words (64 bytes)
    expect(getExpansionCost(mem, 33)).toBe(6n); // cost(2 words)
    
    ensureCapacity(mem, 33);
    expect(memorySize(mem)).toBe(33);
    
    // Expanding from 33 to 65 bytes
    // Current: 2 words (33 rounds to 64), New: 3 words (65 rounds to 96)
    // cost(3) - cost(2) = 9 - 6 = 3
    expect(getExpansionCost(mem, 65)).toBe(3n);
  });

  it('enforces memory limit', () => {
    const mem = createMemory();
    const err = ensureCapacity(mem, 0xFFFFFF + 1);
    expect(err).toBeDefined();
    expect(err?._tag).toBe('OutOfMemoryError');
  });

  it('handles large memory operations', () => {
    const mem = createMemory();
    const largeData = new Uint8Array(1024).fill(0xAB);
    
    const err = setDataEvm(mem, 0, largeData);
    expect(err).toBeUndefined();
    expect(memorySize(mem)).toBe(1024);
    
    const slice = getSlice(mem, 0, 1024);
    for (let i = 0; i < 1024; i++) {
      expect(slice[i]).toBe(0xAB);
    }
  });

  it('stores and retrieves multiple U256 values', () => {
    const mem = createMemory();
    
    const values = [
      0x1111111111111111n,
      0x2222222222222222n,
      0x3333333333333333n
    ];
    
    // Store at offsets 0, 32, 64
    for (let i = 0; i < values.length; i++) {
      setU256(mem, i * 32, values[i]);
    }
    
    // Retrieve and verify
    for (let i = 0; i < values.length; i++) {
      const result = getU256Evm(mem, i * 32);
      expect(result).toBe(values[i]);
    }
  });
});