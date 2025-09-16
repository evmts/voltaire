import type { Frame } from '../frame/frame';
import { ErrorUnion, createError } from '../errors';
import type { DispatchItem } from '../preprocessor/dispatch';
import type { Word } from '../types';
import { Journal } from '../storage/journal';

// Log operations for event emission

// Gas costs for LOG operations
const LOG_GAS_COSTS = {
  LOG_GAS: 375,
  LOG_TOPIC_GAS: 375,
  LOG_DATA_GAS: 8 // per byte
} as const;

// Extended Frame interface for log operations
export interface FrameWithLogs extends Frame {
  journal?: Journal;
  isStatic?: boolean;
  logs?: LogEntry[];
}

export interface LogEntry {
  address: bigint;
  topics: Word[];
  data: Uint8Array;
}

// LOG0 (0xa0) - Append log record with no topics
export function log0(frame: FrameWithLogs, _cursor: DispatchItem[]): ErrorUnion | null {
  if (frame.stack.size() < 2) {
    return createError('StackUnderflow', 'LOG0 requires 2 stack items');
  }
  
  // Check for static call violation
  if (frame.isStatic) {
    return createError('StaticCallViolation', 'LOG0 not allowed in static call');
  }
  
  const offset = frame.stack.pop();
  const size = frame.stack.pop();
  
  // Calculate gas cost
  const gasCost = BigInt(LOG_GAS_COSTS.LOG_GAS) + BigInt(size) * BigInt(LOG_GAS_COSTS.LOG_DATA_GAS);
  if (frame.gasRemaining < gasCost) {
    return createError('OutOfGas', `LOG0 requires ${gasCost} gas`);
  }
  frame.gasRemaining -= gasCost;
  
  // Get log data from memory
  const data = frame.memory.readSlice(Number(offset), Number(size));
  if (data instanceof Error) {
    return createError('MemoryError', data.message);
  }
  
  // Create log entry
  const logEntry: LogEntry = {
    address: frame.contractAddress,
    topics: [],
    data
  };
  
  // Record in journal
  if (frame.journal) {
    frame.journal.recordLog(frame.contractAddress, [], data);
  }
  
  // Add to frame logs
  if (!frame.logs) {
    frame.logs = [];
  }
  frame.logs.push(logEntry);
  
  return null;
}

// LOG1 (0xa1) - Append log record with one topic
export function log1(frame: FrameWithLogs, _cursor: DispatchItem[]): ErrorUnion | null {
  if (frame.stack.size() < 3) {
    return createError('StackUnderflow', 'LOG1 requires 3 stack items');
  }
  
  // Check for static call violation
  if (frame.isStatic) {
    return createError('StaticCallViolation', 'LOG1 not allowed in static call');
  }
  
  const offset = frame.stack.pop();
  const size = frame.stack.pop();
  const topic0 = frame.stack.pop();
  
  // Calculate gas cost
  const gasCost = BigInt(LOG_GAS_COSTS.LOG_GAS) + 
                  BigInt(LOG_GAS_COSTS.LOG_TOPIC_GAS) + 
                  BigInt(size) * BigInt(LOG_GAS_COSTS.LOG_DATA_GAS);
  if (frame.gasRemaining < gasCost) {
    return createError('OutOfGas', `LOG1 requires ${gasCost} gas`);
  }
  frame.gasRemaining -= gasCost;
  
  // Get log data from memory
  const data = frame.memory.readSlice(Number(offset), Number(size));
  if (data instanceof Error) {
    return createError('MemoryError', data.message);
  }
  
  // Create log entry
  const topics = [topic0];
  const logEntry: LogEntry = {
    address: frame.contractAddress,
    topics,
    data
  };
  
  // Record in journal
  if (frame.journal) {
    frame.journal.recordLog(frame.contractAddress, topics, data);
  }
  
  // Add to frame logs
  if (!frame.logs) {
    frame.logs = [];
  }
  frame.logs.push(logEntry);
  
  return null;
}

// LOG2 (0xa2) - Append log record with two topics
export function log2(frame: FrameWithLogs, _cursor: DispatchItem[]): ErrorUnion | null {
  if (frame.stack.size() < 4) {
    return createError('StackUnderflow', 'LOG2 requires 4 stack items');
  }
  
  // Check for static call violation
  if (frame.isStatic) {
    return createError('StaticCallViolation', 'LOG2 not allowed in static call');
  }
  
  const offset = frame.stack.pop();
  const size = frame.stack.pop();
  const topic0 = frame.stack.pop();
  const topic1 = frame.stack.pop();
  
  // Calculate gas cost
  const gasCost = BigInt(LOG_GAS_COSTS.LOG_GAS) + 
                  BigInt(LOG_GAS_COSTS.LOG_TOPIC_GAS) * 2n + 
                  BigInt(size) * BigInt(LOG_GAS_COSTS.LOG_DATA_GAS);
  if (frame.gasRemaining < gasCost) {
    return createError('OutOfGas', `LOG2 requires ${gasCost} gas`);
  }
  frame.gasRemaining -= gasCost;
  
  // Get log data from memory
  const data = frame.memory.readSlice(Number(offset), Number(size));
  if (data instanceof Error) {
    return createError('MemoryError', data.message);
  }
  
  // Create log entry
  const topics = [topic0, topic1];
  const logEntry: LogEntry = {
    address: frame.contractAddress,
    topics,
    data
  };
  
  // Record in journal
  if (frame.journal) {
    frame.journal.recordLog(frame.contractAddress, topics, data);
  }
  
  // Add to frame logs
  if (!frame.logs) {
    frame.logs = [];
  }
  frame.logs.push(logEntry);
  
  return null;
}

// LOG3 (0xa3) - Append log record with three topics
export function log3(frame: FrameWithLogs, _cursor: DispatchItem[]): ErrorUnion | null {
  if (frame.stack.size() < 5) {
    return createError('StackUnderflow', 'LOG3 requires 5 stack items');
  }
  
  // Check for static call violation
  if (frame.isStatic) {
    return createError('StaticCallViolation', 'LOG3 not allowed in static call');
  }
  
  const offset = frame.stack.pop();
  const size = frame.stack.pop();
  const topic0 = frame.stack.pop();
  const topic1 = frame.stack.pop();
  const topic2 = frame.stack.pop();
  
  // Calculate gas cost
  const gasCost = BigInt(LOG_GAS_COSTS.LOG_GAS) + 
                  BigInt(LOG_GAS_COSTS.LOG_TOPIC_GAS) * 3n + 
                  BigInt(size) * BigInt(LOG_GAS_COSTS.LOG_DATA_GAS);
  if (frame.gasRemaining < gasCost) {
    return createError('OutOfGas', `LOG3 requires ${gasCost} gas`);
  }
  frame.gasRemaining -= gasCost;
  
  // Get log data from memory
  const data = frame.memory.readSlice(Number(offset), Number(size));
  if (data instanceof Error) {
    return createError('MemoryError', data.message);
  }
  
  // Create log entry
  const topics = [topic0, topic1, topic2];
  const logEntry: LogEntry = {
    address: frame.contractAddress,
    topics,
    data
  };
  
  // Record in journal
  if (frame.journal) {
    frame.journal.recordLog(frame.contractAddress, topics, data);
  }
  
  // Add to frame logs
  if (!frame.logs) {
    frame.logs = [];
  }
  frame.logs.push(logEntry);
  
  return null;
}

// LOG4 (0xa4) - Append log record with four topics
export function log4(frame: FrameWithLogs, _cursor: DispatchItem[]): ErrorUnion | null {
  if (frame.stack.size() < 6) {
    return createError('StackUnderflow', 'LOG4 requires 6 stack items');
  }
  
  // Check for static call violation
  if (frame.isStatic) {
    return createError('StaticCallViolation', 'LOG4 not allowed in static call');
  }
  
  const offset = frame.stack.pop();
  const size = frame.stack.pop();
  const topic0 = frame.stack.pop();
  const topic1 = frame.stack.pop();
  const topic2 = frame.stack.pop();
  const topic3 = frame.stack.pop();
  
  // Calculate gas cost
  const gasCost = BigInt(LOG_GAS_COSTS.LOG_GAS) + 
                  BigInt(LOG_GAS_COSTS.LOG_TOPIC_GAS) * 4n + 
                  BigInt(size) * BigInt(LOG_GAS_COSTS.LOG_DATA_GAS);
  if (frame.gasRemaining < gasCost) {
    return createError('OutOfGas', `LOG4 requires ${gasCost} gas`);
  }
  frame.gasRemaining -= gasCost;
  
  // Get log data from memory
  const data = frame.memory.readSlice(Number(offset), Number(size));
  if (data instanceof Error) {
    return createError('MemoryError', data.message);
  }
  
  // Create log entry
  const topics = [topic0, topic1, topic2, topic3];
  const logEntry: LogEntry = {
    address: frame.contractAddress,
    topics,
    data
  };
  
  // Record in journal
  if (frame.journal) {
    frame.journal.recordLog(frame.contractAddress, topics, data);
  }
  
  // Add to frame logs
  if (!frame.logs) {
    frame.logs = [];
  }
  frame.logs.push(logEntry);
  
  return null;
}

// Helper function to encode log for RLP
export function encodeLog(log: LogEntry): Uint8Array {
  // This would encode the log in RLP format for inclusion in receipts
  // For now, return a simple concatenation
  const parts: Uint8Array[] = [];
  
  // Add address (20 bytes)
  const addressBytes = new Uint8Array(20);
  let addr = log.address;
  for (let i = 19; i >= 0; i--) {
    addressBytes[i] = Number(addr & 0xFFn);
    addr >>= 8n;
  }
  parts.push(addressBytes);
  
  // Add topics (each 32 bytes)
  for (const topic of log.topics) {
    const topicBytes = new Uint8Array(32);
    let t = topic;
    for (let i = 31; i >= 0; i--) {
      topicBytes[i] = Number(t & 0xFFn);
      t >>= 8n;
    }
    parts.push(topicBytes);
  }
  
  // Add data
  parts.push(log.data);
  
  // Concatenate all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  
  return result;
}

// Function to create bloom filter for logs
export function createBloomFilter(logs: LogEntry[]): Uint8Array {
  // Create a 256-byte bloom filter
  const bloom = new Uint8Array(256);
  
  for (const log of logs) {
    // Add address to bloom
    addToBloom(bloom, log.address.toString());
    
    // Add topics to bloom
    for (const topic of log.topics) {
      addToBloom(bloom, topic.toString());
    }
  }
  
  return bloom;
}

function addToBloom(bloom: Uint8Array, value: string): void {
  // Simple bloom filter implementation
  // In production, this would use proper Keccak256 hashing
  const hash = simpleHash(value);
  
  // Set 3 bits in the bloom filter
  for (let i = 0; i < 3; i++) {
    const bitIndex = (hash + i * 2048) % 2048;
    const byteIndex = Math.floor(bitIndex / 8);
    const bitPosition = bitIndex % 8;
    bloom[byteIndex] |= (1 << bitPosition);
  }
}

function simpleHash(value: string): number {
  // Simple hash function for demo purposes
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}