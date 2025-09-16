import { Word } from '../types';
import { stackPop, stackPush } from '../stack/stack';
import { next } from '../interpreter';
import type { Frame } from '../frame/frame';
import type { Tail } from '../types_runtime';

export function SLOAD(f: Frame, cursor: number): Tail {
  const slot = stackPop(f.stack);
  if (slot instanceof Error) return slot;
  
  // Load value from storage
  const value = f.evm.getStorageAt?.(f.contractAddress, slot as Word) || 0n;
  
  const err = stackPush(f.stack, value);
  if (err instanceof Error) return err;
  
  return next(f, cursor);
}

export function SSTORE(f: Frame, cursor: number): Tail {
  const slot = stackPop(f.stack);
  if (slot instanceof Error) return slot;
  const value = stackPop(f.stack);
  if (value instanceof Error) return value;
  
  // Check if we're in a static call
  if (f.isStatic) {
    return new Error('Cannot modify state in static call');
  }
  
  // Store value in storage
  f.evm.setStorageAt?.(f.contractAddress, slot as Word, value as Word);
  
  return next(f, cursor);
}