import { Word, u256, bytesToWord, wordToBytes32 } from '../types';
import { EvmError } from '../errors';

export class MemoryError extends EvmError {
  readonly _tag = 'MemoryError';
  constructor(message: string) { super(message); }
}

export class OutOfMemoryError extends EvmError {
  readonly _tag = 'OutOfMemoryError';
  constructor() { super('out of memory'); }
}

// Memory limit: 24-bit max (16MB - 1)
const MAX_MEMORY_SIZE = 0xFFFFFF;

export interface Memory {
  checkpoint: number;      // Starting offset for this memory context
  buffer: Uint8Array;      // Actual memory buffer
  size: number;            // Current size in bytes
}

export function createMemory(checkpoint: number = 0): Memory {
  return {
    checkpoint,
    buffer: new Uint8Array(0),
    size: 0
  };
}

// Calculate memory expansion cost in gas
export function calculateMemoryCost(words: bigint): bigint {
  // gas = 3 * words + words² / 512
  return 3n * words + (words * words) / 512n;
}

export function getExpansionCost(memory: Memory, newSize: number): bigint {
  if (newSize <= memory.size) return 0n;
  
  const currentWords = BigInt((memory.size + 31) >> 5);  // Divide by 32, round up
  const newWords = BigInt((newSize + 31) >> 5);
  
  const currentCost = calculateMemoryCost(currentWords);
  const newCost = calculateMemoryCost(newWords);
  
  return newCost - currentCost;
}

// Ensure memory has capacity for the given size
export function ensureCapacity(memory: Memory, newSize: number): void | MemoryError {
  if (newSize > MAX_MEMORY_SIZE) {
    return new OutOfMemoryError();
  }
  
  if (newSize <= memory.size) return;
  
  // Create new buffer with expanded size
  const newBuffer = new Uint8Array(newSize);
  
  // Copy existing data
  if (memory.buffer.length > 0) {
    newBuffer.set(memory.buffer);
  }
  
  // Update memory
  memory.buffer = newBuffer;
  memory.size = newSize;
}

// Set data at offset, expanding to word boundary
export function setDataEvm(memory: Memory, offset: number, data: Uint8Array): void | MemoryError {
  if (data.length === 0) return;
  
  const endOffset = offset + data.length;
  
  // Word-align the end for EVM operations
  const wordAlignedEnd = (endOffset + 31) & ~31;
  
  const err = ensureCapacity(memory, wordAlignedEnd);
  if (err) return err;
  
  // Copy data to memory
  memory.buffer.set(data, offset);
}

// Set a single byte at offset
export function setByte(memory: Memory, offset: number, value: number): void | MemoryError {
  const newSize = offset + 1;
  
  const err = ensureCapacity(memory, newSize);
  if (err) return err;
  
  memory.buffer[offset] = value & 0xFF;
}

// Get slice without expansion
export function getSlice(memory: Memory, offset: number, length: number): Uint8Array {
  if (offset >= memory.size) {
    // Return zeros for out-of-bounds reads
    return new Uint8Array(length);
  }
  
  const availableLength = Math.min(length, memory.size - offset);
  const result = new Uint8Array(length);
  
  if (availableLength > 0) {
    result.set(memory.buffer.subarray(offset, offset + availableLength));
  }
  
  // Rest is already zero-initialized
  return result;
}

// Get 32-byte word at offset, expanding memory if needed
export function getU256Evm(memory: Memory, offset: number): Word | MemoryError {
  // Word-align the read
  const wordAlignedEnd = (offset + 32 + 31) & ~31;
  
  const err = ensureCapacity(memory, wordAlignedEnd);
  if (err) return err;
  
  // Read 32 bytes
  const bytes = memory.buffer.subarray(offset, offset + 32);
  return bytesToWord(bytes);
}

// Set 32-byte word at offset
export function setU256(memory: Memory, offset: number, value: Word): void | MemoryError {
  const data = wordToBytes32(value);
  return setDataEvm(memory, offset, data);
}

// Copy memory internally
export function memoryCopy(memory: Memory, destOffset: number, srcOffset: number, length: number): void | MemoryError {
  if (length === 0) return;
  
  // Calculate expansion for both source and destination
  const srcEnd = srcOffset + length;
  const destEnd = destOffset + length;
  const maxEnd = Math.max(srcEnd, destEnd);
  
  // Word-align the expansion
  const wordAlignedEnd = (maxEnd + 31) & ~31;
  
  const err = ensureCapacity(memory, wordAlignedEnd);
  if (err) return err;
  
  // Handle overlapping regions
  if (srcOffset === destOffset) {
    // No-op
    return;
  }
  
  // Read source data (handles out-of-bounds with zeros)
  const sourceData = getSlice(memory, srcOffset, length);
  
  // Write to destination
  memory.buffer.set(sourceData, destOffset);
}

// Get current memory size
export function memorySize(memory: Memory): number {
  return memory.size;
}

// Create a child memory context (for CALL/CREATE)
export function createChildMemory(parentMemory: Memory): Memory {
  return {
    checkpoint: parentMemory.size,
    buffer: parentMemory.buffer,
    size: parentMemory.size
  };
}

// Restore parent memory context
export function restoreParentMemory(parentMemory: Memory, childMemory: Memory): void {
  parentMemory.buffer = childMemory.buffer;
  parentMemory.size = childMemory.checkpoint;
}