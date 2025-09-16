import { Word, toSigned } from '../types';
import { stackPop, stackPush } from '../stack/stack';
import { next } from '../interpreter';
import type { Frame } from '../frame/frame';
import type { Tail } from '../types_runtime';

export function LT(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = (a as Word) < (b as Word) ? 1n : 0n;
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function GT(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = (a as Word) > (b as Word) ? 1n : 0n;
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function SLT(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const aSigned = toSigned(a as Word);
  const bSigned = toSigned(b as Word);
  const r = aSigned < bSigned ? 1n : 0n;
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function SGT(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const aSigned = toSigned(a as Word);
  const bSigned = toSigned(b as Word);
  const r = aSigned > bSigned ? 1n : 0n;
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function EQ(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = (a as Word) === (b as Word) ? 1n : 0n;
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function ISZERO(f: Frame, cursor: number): Tail {
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  const r = (a as Word) === 0n ? 1n : 0n;
  const e = stackPush(f.stack, r);
  if (e instanceof Error) return e;
  return next(f, cursor);
}