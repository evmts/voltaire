import { Word } from '../types';
import { StackOverflowError, StackUnderflowError } from '../errors';

export interface Stack {
  items: Word[];
  limit: number;
}

export function createStack(limit: number = 1024): Stack {
  return { items: [], limit };
}

export function stackSize(s: Stack): number {
  return s.items.length;
}

export function stackPush(s: Stack, v: Word): void | StackOverflowError {
  if (s.items.length >= s.limit) return new StackOverflowError();
  s.items.push(v);
}

export function stackPop(s: Stack): Word | StackUnderflowError {
  if (s.items.length === 0) return new StackUnderflowError();
  return s.items.pop() as Word;
}

export function stackPeek(s: Stack, depth: number = 0): Word | StackUnderflowError {
  const idx = s.items.length - 1 - depth;
  if (idx < 0) return new StackUnderflowError();
  return s.items[idx];
}

export function stackSetTop(s: Stack, v: Word): void | StackUnderflowError {
  if (s.items.length === 0) return new StackUnderflowError();
  s.items[s.items.length - 1] = v;
}

export function stackDup(s: Stack, n: number): void | StackUnderflowError | StackOverflowError {
  // n in 1..16, duplicates nth item from top onto top
  const val = stackPeek(s, n - 1);
  if (val instanceof Error) return val;
  return stackPush(s, val as Word);
}

export function stackSwap(s: Stack, n: number): void | StackUnderflowError {
  // n in 1..16, swap top with nth item from top
  const topIdx = s.items.length - 1;
  const otherIdx = topIdx - n;
  if (topIdx < 0 || otherIdx < 0) return new StackUnderflowError();
  const tmp = s.items[topIdx];
  s.items[topIdx] = s.items[otherIdx];
  s.items[otherIdx] = tmp;
}