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

export function EXP(f: Frame, cursor: number): Tail {
  const exponent = stackPop(f.stack);
  if (exponent instanceof Error) return exponent;
  const base = stackPop(f.stack);
  if (base instanceof Error) return base;
  
  // Special cases for efficiency
  if (exponent === 0n) {
    const e = stackPush(f.stack, 1n);
    if (e instanceof Error) return e;
    return next(f, cursor);
  }
  
  if (base === 0n) {
    const e = stackPush(f.stack, 0n);
    if (e instanceof Error) return e;
    return next(f, cursor);
  }
  
  // Modular exponentiation for 256-bit result
  // Using binary exponentiation to handle large exponents efficiently
  let result = 1n;
  let b = base as Word;
  let exp = exponent as Word;
  const MOD = (1n << 256n);
  
  while (exp > 0n) {
    if (exp & 1n) {
      result = (result * b) % MOD;
    }
    b = (b * b) % MOD;
    exp >>= 1n;
  }
  
  const e = stackPush(f.stack, result);
  if (e instanceof Error) return e;
  return next(f, cursor);
}

export function SIGNEXTEND(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack);
  if (b instanceof Error) return b;
  const a = stackPop(f.stack);
  if (a instanceof Error) return a;
  
  const byteNum = b as Word;
  const value = a as Word;
  
  // If byte number is >= 31, no extension needed (full 256 bits)
  if (byteNum >= 31n) {
    const e = stackPush(f.stack, value);
    if (e instanceof Error) return e;
    return next(f, cursor);
  }
  
  // Calculate bit position of sign bit
  const bitPos = Number(byteNum) * 8 + 7;
  const signBit = (value >> BigInt(bitPos)) & 1n;
  
  let result: Word;
  if (signBit === 0n) {
    // Positive number - clear upper bits
    const mask = (1n << BigInt(bitPos + 1)) - 1n;
    result = value & mask;
  } else {
    // Negative number - set upper bits
    const mask = (1n << BigInt(bitPos + 1)) - 1n;
    const upperMask = ((1n << 256n) - 1n) ^ mask;
    result = value | upperMask;
  }
  
  const e = stackPush(f.stack, u256(result));
  if (e instanceof Error) return e;
  return next(f, cursor);
}