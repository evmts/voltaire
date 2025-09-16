import { Word } from '../types';
import { StackOverflowError, StackUnderflowError } from '../errors';

export interface Stack {
  items: Word[];
  limit: number;
}

export interface StackConfig {
  stack_size?: number;
  WordType?: any; // In TS we just use Word type
}

const DEFAULT_STACK_SIZE = 1024;

export function createStack(limit: number = DEFAULT_STACK_SIZE): Stack {
  return { items: [], limit };
}

export function stackSize(s: Stack): number {
  return s.items.length;
}

// === Basic Operations ===

export function stackPush(s: Stack, v: Word): void | StackOverflowError {
  if (s.items.length >= s.limit) return new StackOverflowError();
  s.items.push(v);
}

export function stackPushUnsafe(s: Stack, v: Word): void {
  s.items.push(v);
}

export function stackPop(s: Stack): Word | StackUnderflowError {
  if (s.items.length === 0) return new StackUnderflowError();
  return s.items.pop() as Word;
}

export function stackPopUnsafe(s: Stack): Word {
  return s.items.pop() as Word;
}

export function stackPeek(s: Stack, depth: number = 0): Word | StackUnderflowError {
  const idx = s.items.length - 1 - depth;
  if (idx < 0) return new StackUnderflowError();
  return s.items[idx];
}

export function stackPeekUnsafe(s: Stack): Word {
  return s.items[s.items.length - 1];
}

export function stackSetTop(s: Stack, v: Word): void | StackUnderflowError {
  if (s.items.length === 0) return new StackUnderflowError();
  s.items[s.items.length - 1] = v;
}

export function stackSetTopUnsafe(s: Stack, v: Word): void {
  s.items[s.items.length - 1] = v;
}

// === Binary Operations ===

export function stackBinaryOpUnsafe(s: Stack, op: (a: Word, b: Word) => Word): void {
  const top = s.items[s.items.length - 1];
  const second = s.items[s.items.length - 2];
  s.items[s.items.length - 2] = op(second, top);
  s.items.pop();
}

// === DUP Operations ===

export function stackDupN(s: Stack, n: number): void | StackUnderflowError | StackOverflowError {
  // Check if we have n items on stack
  if (s.items.length < n) return new StackUnderflowError();
  // Check if we have room for one more
  if (s.items.length >= s.limit) return new StackOverflowError();
  // Get nth item from top (n-1 due to 0-indexing, and counting from end)
  const value = s.items[s.items.length - n];
  s.items.push(value);
}

export function stackDupNUnsafe(s: Stack, n: number): void {
  const value = s.items[s.items.length - n];
  s.items.push(value);
}

// DUP1-DUP16 operations
export function stackDup1(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 1);
}

export function stackDup2(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 2);
}

export function stackDup3(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 3);
}

export function stackDup4(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 4);
}

export function stackDup5(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 5);
}

export function stackDup6(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 6);
}

export function stackDup7(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 7);
}

export function stackDup8(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 8);
}

export function stackDup9(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 9);
}

export function stackDup10(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 10);
}

export function stackDup11(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 11);
}

export function stackDup12(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 12);
}

export function stackDup13(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 13);
}

export function stackDup14(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 14);
}

export function stackDup15(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 15);
}

export function stackDup16(s: Stack): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, 16);
}

// === SWAP Operations ===

export function stackSwapN(s: Stack, n: number): void | StackUnderflowError {
  // Check if we have n+1 items on stack
  if (s.items.length < n + 1) return new StackUnderflowError();
  // Swap top with nth item
  const topIdx = s.items.length - 1;
  const otherIdx = topIdx - n;
  const tmp = s.items[topIdx];
  s.items[topIdx] = s.items[otherIdx];
  s.items[otherIdx] = tmp;
}

export function stackSwapNUnsafe(s: Stack, n: number): void {
  const topIdx = s.items.length - 1;
  const otherIdx = topIdx - n;
  const tmp = s.items[topIdx];
  s.items[topIdx] = s.items[otherIdx];
  s.items[otherIdx] = tmp;
}

// SWAP1-SWAP16 operations
export function stackSwap1(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 1);
}

export function stackSwap2(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 2);
}

export function stackSwap3(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 3);
}

export function stackSwap4(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 4);
}

export function stackSwap5(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 5);
}

export function stackSwap6(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 6);
}

export function stackSwap7(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 7);
}

export function stackSwap8(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 8);
}

export function stackSwap9(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 9);
}

export function stackSwap10(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 10);
}

export function stackSwap11(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 11);
}

export function stackSwap12(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 12);
}

export function stackSwap13(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 13);
}

export function stackSwap14(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 14);
}

export function stackSwap15(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 15);
}

export function stackSwap16(s: Stack): void | StackUnderflowError {
  return stackSwapN(s, 16);
}

// === Utility Functions ===

export function stackGetSlice(s: Stack): Word[] {
  return [...s.items];
}

// Legacy functions for backward compatibility
export function stackDup(s: Stack, n: number): void | StackUnderflowError | StackOverflowError {
  return stackDupN(s, n);
}

export function stackSwap(s: Stack, n: number): void | StackUnderflowError {
  return stackSwapN(s, n);
}