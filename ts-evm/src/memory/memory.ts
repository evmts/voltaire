import { Word, u256, bytesToWord, wordToBytes32 } from '../types';
import { MemoryError, OutOfMemoryError, MemoryOverflowError } from '../errors';

// EVM memory constants
const WORD_SIZE = 32;
const WORD_SHIFT = 5; // log2(32)
const WORD_MASK = 31; // 32 - 1
const FAST_PATH_THRESHOLD = 32;

// Memory limit: 24-bit max (16MB - 1) matching Zig implementation
const MAX_MEMORY_SIZE = 0xFFFFFF;
const DEFAULT_INITIAL_CAPACITY = 256;

export interface MemoryConfig {
  initial_capacity?: number;
  memory_limit?: number;
  owned?: boolean;
}

export interface Memory {
  checkpoint: number;      // Starting offset for this memory context
  buffer: Uint8Array;      // Actual memory buffer
  size: number;            // Current size in bytes
  owned: boolean;          // Whether this memory owns its buffer
}

// Calculate memory expansion cost in gas (EIP-150)
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

// Create new memory instance
export function createMemory(config: MemoryConfig = {}): Memory {
  const initial_capacity = config.initial_capacity ?? DEFAULT_INITIAL_CAPACITY;
  const owned = config.owned ?? true;
  
  return {
    checkpoint: 0,
    buffer: new Uint8Array(initial_capacity),
    size: 0,
    owned
  };
}

// Create borrowed memory (child context)
export function createBorrowedMemory(buffer: Uint8Array, checkpoint: number): Memory {
  return {
    checkpoint,
    buffer,
    size: buffer.length,
    owned: false
  };
}

// Create child memory context (for CALL/CREATE)
export function createChildMemory(parent: Memory): Memory {
  return {
    checkpoint: parent.size,
    buffer: parent.buffer,
    size: parent.size,
    owned: false
  };
}

// Get current memory size
export function memorySize(memory: Memory): number {
  const total = memory.size;
  const checkpoint = memory.checkpoint;
  if (total <= checkpoint) return 0;
  return total - checkpoint;
}

// Get current size in words
export function memorySizeWords(memory: Memory): number {
  return (memorySize(memory) + 31) >> 5;
}

// Ensure memory has capacity for the given size
export function ensureCapacity(memory: Memory, newSize: number): void | MemoryError {
  if (newSize > MAX_MEMORY_SIZE) {
    return new MemoryOverflowError();
  }
  
  if (newSize <= memory.size) return;
  
  // Word-align the new size
  const alignedSize = (newSize + 31) & ~31;
  
  // Create new buffer with expanded size
  const newBuffer = new Uint8Array(alignedSize);
  
  // Copy existing data
  if (memory.buffer.length > 0 && memory.size > 0) {
    newBuffer.set(memory.buffer.subarray(0, memory.size));
  }
  
  // Update memory
  memory.buffer = newBuffer;
  memory.size = alignedSize;
}

// Unsafe version without error checking (for performance)
export function ensureCapacityUnsafe(memory: Memory, newSize: number): void {
  if (newSize <= memory.size) return;
  
  const alignedSize = (newSize + 31) & ~31;
  const newBuffer = new Uint8Array(alignedSize);
  
  if (memory.buffer.length > 0 && memory.size > 0) {
    newBuffer.set(memory.buffer.subarray(0, memory.size));
  }
  
  memory.buffer = newBuffer;
  memory.size = alignedSize;
}

// Set data at offset with EVM word alignment
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

// Unsafe set without error checking
export function setDataEvmUnsafe(memory: Memory, offset: number, data: Uint8Array): void {
  if (data.length === 0) return;
  
  const endOffset = offset + data.length;
  const wordAlignedEnd = (endOffset + 31) & ~31;
  
  ensureCapacityUnsafe(memory, wordAlignedEnd);
  memory.buffer.set(data, offset);
}

// Set a single byte at offset
export function setByte(memory: Memory, offset: number, value: number): void | MemoryError {
  const newSize = offset + 1;
  
  const err = ensureCapacity(memory, newSize);
  if (err) return err;
  
  memory.buffer[offset] = value & 0xFF;
}

// Unsafe setByte
export function setByteUnsafe(memory: Memory, offset: number, value: number): void {
  const newSize = offset + 1;
  ensureCapacityUnsafe(memory, newSize);
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

// Get 32-byte word at offset, expanding memory if needed (EVM MLOAD)
export function getU256Evm(memory: Memory, offset: number): Word | MemoryError {
  // Word-align the read
  const wordAlignedEnd = (offset + 32 + 31) & ~31;
  
  const err = ensureCapacity(memory, wordAlignedEnd);
  if (err) return err;
  
  // Read 32 bytes
  const bytes = memory.buffer.subarray(offset, offset + 32);
  return bytesToWord(bytes);
}

// Unsafe getU256
export function getU256EvmUnsafe(memory: Memory, offset: number): Word {
  const wordAlignedEnd = (offset + 32 + 31) & ~31;
  ensureCapacityUnsafe(memory, wordAlignedEnd);
  
  const bytes = memory.buffer.subarray(offset, offset + 32);
  return bytesToWord(bytes);
}

// Set 32-byte word at offset (EVM MSTORE)
export function setU256(memory: Memory, offset: number, value: Word): void | MemoryError {
  const data = wordToBytes32(value);
  return setDataEvm(memory, offset, data);
}

// Unsafe setU256
export function setU256Unsafe(memory: Memory, offset: number, value: Word): void {
  const data = wordToBytes32(value);
  setDataEvmUnsafe(memory, offset, data);
}

// Copy memory internally (EVM MCOPY)
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

// Unsafe memory copy
export function memoryCopyUnsafe(memory: Memory, destOffset: number, srcOffset: number, length: number): void {
  if (length === 0) return;
  
  const srcEnd = srcOffset + length;
  const destEnd = destOffset + length;
  const maxEnd = Math.max(srcEnd, destEnd);
  const wordAlignedEnd = (maxEnd + 31) & ~31;
  
  ensureCapacityUnsafe(memory, wordAlignedEnd);
  
  if (srcOffset === destOffset) return;
  
  const sourceData = getSlice(memory, srcOffset, length);
  memory.buffer.set(sourceData, destOffset);
}

// Copy from external data (EVM CALLDATACOPY, CODECOPY, etc.)
export function copyFromExternal(
  memory: Memory, 
  destOffset: number, 
  data: Uint8Array, 
  srcOffset: number, 
  length: number
): void | MemoryError {
  if (length === 0) return;
  
  // Word-align the destination expansion
  const destEnd = destOffset + length;
  const wordAlignedEnd = (destEnd + 31) & ~31;
  
  const err = ensureCapacity(memory, wordAlignedEnd);
  if (err) return err;
  
  // Handle source out of bounds with zero padding
  const availableLength = Math.max(0, Math.min(length, data.length - srcOffset));
  
  if (availableLength > 0) {
    memory.buffer.set(data.subarray(srcOffset, srcOffset + availableLength), destOffset);
  }
  
  // Zero-fill any remaining bytes
  if (availableLength < length) {
    memory.buffer.fill(0, destOffset + availableLength, destOffset + length);
  }
}

// Unsafe copy from external
export function copyFromExternalUnsafe(
  memory: Memory, 
  destOffset: number, 
  data: Uint8Array, 
  srcOffset: number, 
  length: number
): void {
  if (length === 0) return;
  
  const destEnd = destOffset + length;
  const wordAlignedEnd = (destEnd + 31) & ~31;
  
  ensureCapacityUnsafe(memory, wordAlignedEnd);
  
  const availableLength = Math.max(0, Math.min(length, data.length - srcOffset));
  
  if (availableLength > 0) {
    memory.buffer.set(data.subarray(srcOffset, srcOffset + availableLength), destOffset);
  }
  
  if (availableLength < length) {
    memory.buffer.fill(0, destOffset + availableLength, destOffset + length);
  }
}

// Restore parent memory context after child execution
export function restoreParentMemory(parent: Memory, child: Memory): void {
  parent.buffer = child.buffer;
  parent.size = child.checkpoint;
}

// Clear memory (for testing)
export function clearMemory(memory: Memory): void {
  memory.buffer = new Uint8Array(DEFAULT_INITIAL_CAPACITY);
  memory.size = 0;
  memory.checkpoint = 0;
}