import { Word, u256, toSigned } from '../types';
import { stackPop, stackPush } from '../stack/stack';
import { next } from '../interpreter';
import type { Frame } from '../frame/frame';
import type { Tail } from '../types_runtime';

export function AND(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = (a as Word) & (b as Word);
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function OR(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = (a as Word) | (b as Word);
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function XOR(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = (a as Word) ^ (b as Word);
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function NOT(f: Frame, cursor: number): Tail {
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = u256(~(a as Word));
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function BYTE(f: Frame, cursor: number): Tail {
  const i = stackPop(f.stack);
  if (i instanceof Error) return i;
  const x = stackPop(f.stack);
  if (x instanceof Error) return x;
  
  let r: Word;
  if ((i as Word) >= 32n) {
    r = 0n;
  } else {
    const bytePos = Number(i as Word);
    const shiftAmount = BigInt((31 - bytePos) * 8);
    r = ((x as Word) >> shiftAmount) & 0xffn;
  }
  
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function SHL(f: Frame, cursor: number): Tail {
  const shift = stackPop(f.stack);
  if (shift instanceof Error) return shift;
  const value = stackPop(f.stack);
  if (value instanceof Error) return value;
  
  const r = (shift as Word) >= 256n ? 0n : u256((value as Word) << (shift as Word));
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function SHR(f: Frame, cursor: number): Tail {
  const shift = stackPop(f.stack);
  if (shift instanceof Error) return shift;
  const value = stackPop(f.stack);
  if (value instanceof Error) return value;
  
  const r = (shift as Word) >= 256n ? 0n : (value as Word) >> (shift as Word);
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function SAR(f: Frame, cursor: number): Tail {
  const shift = stackPop(f.stack);
  if (shift instanceof Error) return shift;
  const value = stackPop(f.stack);
  if (value instanceof Error) return value;
  
  let r: Word;
  if ((shift as Word) >= 256n) {
    // Check sign bit
    const signBit = (value as Word) & (1n << 255n);
    r = signBit !== 0n ? u256(-1n) : 0n;
  } else {
    const signed = toSigned(value as Word);
    const shifted = signed >> (shift as Word);
    r = u256(shifted);
  }
  
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}