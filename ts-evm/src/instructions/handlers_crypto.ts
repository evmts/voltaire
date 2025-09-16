import { keccak256 } from 'js-sha3';
import { Word, bytesToWord } from '../types';
import { stackPop, stackPush } from '../stack/stack';
import { next } from '../interpreter';
import { getSlice, ensureCapacity } from '../memory/memory';
import type { Frame } from '../frame/frame';
import type { Tail } from '../types_runtime';

export function KECCAK256(f: Frame, cursor: number): Tail {
  const offset = stackPop(f.stack);
  if (offset instanceof Error) return offset;
  const length = stackPop(f.stack);
  if (length instanceof Error) return length;
  
  const offsetNum = Number(offset as Word);
  const lengthNum = Number(length as Word);
  
  // Expand memory if needed
  if (lengthNum > 0) {
    const memError = ensureCapacity(f.memory, offsetNum + lengthNum);
    if (memError instanceof Error) return memError;
  }
  
  // Read data from memory
  const data = getSlice(f.memory, offsetNum, lengthNum);
  
  // Compute Keccak256 hash
  const hashBytes = keccak256.array(data);
  const hashWord = bytesToWord(new Uint8Array(hashBytes));
  
  // Push result to stack
  const pushError = stackPush(f.stack, hashWord);
  if (pushError instanceof Error) return pushError;
  
  return next(f, cursor);
}