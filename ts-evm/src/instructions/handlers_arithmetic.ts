import { Word, u256, toSigned, fromSigned } from '../types';
import { stackPop, stackPush } from '../stack/stack';
import { next } from '../interpreter';
import type { Frame } from '../frame/frame';
import type { Tail } from '../types_runtime';

export function ADD(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = u256((a as Word) + (b as Word));
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function MUL(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = u256((a as Word) * (b as Word));
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function SUB(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = u256((a as Word) - (b as Word));
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function DIV(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = b === 0n ? 0n : u256((a as Word) / (b as Word));
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function SDIV(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  
  if (b === 0n) {
    const e = stackPush(f.stack, 0n);
    if (e instanceof Error) return e;
    return next(f, cursor);
  }
  
  const aSigned = toSigned(a as Word);
  const bSigned = toSigned(b as Word);
  const r = fromSigned(aSigned / bSigned);
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function MOD(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = b === 0n ? 0n : u256((a as Word) % (b as Word));
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function SMOD(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  
  if (b === 0n) {
    const e = stackPush(f.stack, 0n);
    if (e instanceof Error) return e;
    return next(f, cursor);
  }
  
  const aSigned = toSigned(a as Word);
  const bSigned = toSigned(b as Word);
  // SMOD: sign follows dividend, magnitude is |a| % |b|
  const absA = aSigned < 0n ? -aSigned : aSigned;
  const absB = bSigned < 0n ? -bSigned : bSigned;
  const result = absA % absB;
  const r = fromSigned(aSigned < 0n ? -result : result);
  
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function ADDMOD(f: Frame, cursor: number): Tail {
  const N = stackPop(f.stack);
  if (N instanceof Error) return N;
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  
  if (N === 0n) {
    const e = stackPush(f.stack, 0n);
    if (e instanceof Error) return e;
    return next(f, cursor);
  }
  
  // Use bigint to avoid overflow
  const sum = (a as Word) + (b as Word);
  const r = u256(sum % (N as Word));
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function MULMOD(f: Frame, cursor: number): Tail {
  const N = stackPop(f.stack);
  if (N instanceof Error) return N;
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  
  if (N === 0n) {
    const e = stackPush(f.stack, 0n);
    if (e instanceof Error) return e;
    return next(f, cursor);
  }
  
  // Use bigint to avoid overflow
  const product = (a as Word) * (b as Word);
  const r = u256(product % (N as Word));
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}