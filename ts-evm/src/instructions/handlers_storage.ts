import type { Frame } from '../frame/frame';
import { ErrorUnion, createError } from '../errors';
import type { DispatchItem } from '../preprocessor/dispatch';
import type { Word } from '../types';
import { Database } from '../storage/database';
import { AccessList, GAS_COSTS } from '../storage/access_list';
import { Journal } from '../storage/journal';

// Storage operations for persistent state

// Gas costs for SSTORE (EIP-2200)
const SSTORE_GAS = {
  SSTORE_SET: 20000,
  SSTORE_RESET: 5000,
  SSTORE_CLEAR_REFUND: 15000,
  SLOAD_GAS: 100,
  COLD_SLOAD_COST: 2100,
  WARM_STORAGE_READ: 100,
  SSTORE_CLEARS_SCHEDULE: 15000
} as const;

// Extended Frame interface with storage
export interface FrameWithStorage extends Frame {
  database?: Database;
  accessList?: AccessList;
  journal?: Journal;
  isStatic?: boolean;
}

export function sload(frame: FrameWithStorage, _cursor: DispatchItem[]): ErrorUnion | null {
  // SLOAD (0x54) - Load from storage
  if (frame.stack.size() < 1) {
    return createError('StackUnderflow', 'SLOAD requires 1 stack item');
  }
  
  if (!frame.database) {
    return createError('StorageError', 'No database available');
  }
  
  const key = frame.stack.pop();
  
  // Calculate gas cost based on access list (EIP-2929)
  let gasCost = SSTORE_GAS.SLOAD_GAS;
  if (frame.accessList) {
    gasCost = frame.accessList.accessStorage(frame.contractAddress, key);
  }
  
  // Check gas
  if (frame.gasRemaining < BigInt(gasCost)) {
    return createError('OutOfGas', `SLOAD requires ${gasCost} gas`);
  }
  frame.gasRemaining -= BigInt(gasCost);
  
  // Load value from storage
  const value = frame.database.getStorage(frame.contractAddress, key);
  
  // Record in journal if enabled
  if (frame.journal) {
    frame.journal.recordStorageChange(frame.contractAddress, key, value, value);
  }
  
  const result = frame.stack.push(value);
  if (result instanceof Error) {
    return createError('StackOverflow', 'SLOAD would exceed stack limit');
  }
  
  return null;
}

export function sstore(frame: FrameWithStorage, _cursor: DispatchItem[]): ErrorUnion | null {
  // SSTORE (0x55) - Store to storage
  if (frame.stack.size() < 2) {
    return createError('StackUnderflow', 'SSTORE requires 2 stack items');
  }
  
  // Check for static call violation
  if (frame.isStatic) {
    return createError('StaticCallViolation', 'SSTORE not allowed in static call');
  }
  
  if (!frame.database) {
    return createError('StorageError', 'No database available');
  }
  
  const key = frame.stack.pop();
  const value = frame.stack.pop();
  
  // Get current value for gas calculation
  const currentValue = frame.database.getStorage(frame.contractAddress, key);
  
  // Calculate gas cost (simplified EIP-2200)
  let gasCost = calculateSstoreGas(currentValue, value, frame.accessList, frame.contractAddress, key);
  
  // Check gas
  if (frame.gasRemaining < BigInt(gasCost)) {
    return createError('OutOfGas', `SSTORE requires ${gasCost} gas`);
  }
  frame.gasRemaining -= BigInt(gasCost);
  
  // Record in journal before change
  if (frame.journal) {
    frame.journal.recordStorageChange(frame.contractAddress, key, currentValue, value);
  }
  
  // Store value
  frame.database.setStorage(frame.contractAddress, key, value);
  
  return null;
}

export function tload(frame: FrameWithStorage, _cursor: DispatchItem[]): ErrorUnion | null {
  // TLOAD (0x5c) - Load from transient storage (EIP-1153)
  if (frame.stack.size() < 1) {
    return createError('StackUnderflow', 'TLOAD requires 1 stack item');
  }
  
  if (!frame.database) {
    return createError('StorageError', 'No database available');
  }
  
  const key = frame.stack.pop();
  
  // Transient storage has fixed gas cost
  const gasCost = 100;
  if (frame.gasRemaining < BigInt(gasCost)) {
    return createError('OutOfGas', `TLOAD requires ${gasCost} gas`);
  }
  frame.gasRemaining -= BigInt(gasCost);
  
  // Load value from transient storage
  const value = frame.database.getTransientStorage(frame.contractAddress, key);
  
  const result = frame.stack.push(value);
  if (result instanceof Error) {
    return createError('StackOverflow', 'TLOAD would exceed stack limit');
  }
  
  return null;
}

export function tstore(frame: FrameWithStorage, _cursor: DispatchItem[]): ErrorUnion | null {
  // TSTORE (0x5d) - Store to transient storage (EIP-1153)
  if (frame.stack.size() < 2) {
    return createError('StackUnderflow', 'TSTORE requires 2 stack items');
  }
  
  // Check for static call violation
  if (frame.isStatic) {
    return createError('StaticCallViolation', 'TSTORE not allowed in static call');
  }
  
  if (!frame.database) {
    return createError('StorageError', 'No database available');
  }
  
  const key = frame.stack.pop();
  const value = frame.stack.pop();
  
  // Transient storage has fixed gas cost
  const gasCost = 100;
  if (frame.gasRemaining < BigInt(gasCost)) {
    return createError('OutOfGas', `TSTORE requires ${gasCost} gas`);
  }
  frame.gasRemaining -= BigInt(gasCost);
  
  // Get current value for journal
  const currentValue = frame.database.getTransientStorage(frame.contractAddress, key);
  
  // Record in journal if enabled
  if (frame.journal) {
    frame.journal.recordTransientStorageChange(frame.contractAddress, key, currentValue, value);
  }
  
  // Store value in transient storage
  frame.database.setTransientStorage(frame.contractAddress, key, value);
  
  return null;
}

// Helper function to calculate SSTORE gas cost
function calculateSstoreGas(
  currentValue: Word,
  newValue: Word,
  accessList: AccessList | undefined,
  address: any,
  key: Word
): number {
  // Base cost for accessing storage slot
  let gasCost = 0;
  
  // Cold/warm access cost (EIP-2929)
  if (accessList) {
    const accessCost = accessList.accessStorage(address, key);
    gasCost += accessCost;
  } else {
    gasCost += SSTORE_GAS.SLOAD_GAS;
  }
  
  // Additional cost based on value changes (simplified EIP-2200)
  if (currentValue === 0n && newValue !== 0n) {
    // Setting from zero to non-zero
    gasCost += SSTORE_GAS.SSTORE_SET;
  } else if (currentValue !== 0n && newValue === 0n) {
    // Clearing to zero (eligible for refund)
    gasCost += SSTORE_GAS.SSTORE_RESET;
    // Note: Refund would be added to refund counter (not implemented here)
  } else if (currentValue !== newValue) {
    // Changing non-zero to different non-zero
    gasCost += SSTORE_GAS.SSTORE_RESET;
  }
  // If currentValue === newValue, no additional cost
  
  return gasCost;
}

// Storage-related utility functions

export function isStorageEmpty(database: Database, address: any): boolean {
  // Check if an account has any non-zero storage values
  // This would require iterating through storage, which is expensive
  // For now, return false to be safe
  return false;
}

export function clearStorage(database: Database, address: any): void {
  // Clear all storage for an account
  // This would be used during SELFDESTRUCT
  // Implementation would depend on database structure
}

export function getStorageRoot(database: Database, address: any): Uint8Array {
  // Calculate storage root for an account
  // This would involve building a Merkle Patricia Trie
  // For now, return a placeholder
  return new Uint8Array(32);
}