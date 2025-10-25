/**
 * Tests for Uint64 utilities
 */

import { describe, test, expect } from 'bun:test';
import * as Uint64 from './uint64';

describe('Uint64 Constants', () => {
  test('UINT64_ZERO', () => {
    expect(Uint64.toBigInt(Uint64.UINT64_ZERO)).toBe(0n);
  });

  test('UINT64_ONE', () => {
    expect(Uint64.toBigInt(Uint64.UINT64_ONE)).toBe(1n);
  });

  test('UINT64_MAX', () => {
    expect(Uint64.toBigInt(Uint64.UINT64_MAX)).toBe(18446744073709551615n);
  });
});

describe('Uint64.fromBigInt', () => {
  test('converts zero', () => {
    const result = Uint64.fromBigInt(0n);
    expect(result).toBe('0x0');
  });

  test('converts one', () => {
    const result = Uint64.fromBigInt(1n);
    expect(result).toBe('0x1');
  });

  test('converts maximum value', () => {
    const result = Uint64.fromBigInt(18446744073709551615n);
    expect(result).toBe('0xffffffffffffffff');
  });

  test('converts arbitrary value', () => {
    const result = Uint64.fromBigInt(42n);
    expect(result).toBe('0x2a');
  });

  test('throws on negative value', () => {
    expect(() => Uint64.fromBigInt(-1n)).toThrow('below minimum');
  });

  test('throws on value exceeding maximum', () => {
    expect(() => Uint64.fromBigInt(18446744073709551616n)).toThrow('exceeds maximum');
  });
});

describe('Uint64.toBigInt', () => {
  test('converts zero', () => {
    const result = Uint64.toBigInt('0x0' as Uint64.Uint64);
    expect(result).toBe(0n);
  });

  test('converts one', () => {
    const result = Uint64.toBigInt('0x1' as Uint64.Uint64);
    expect(result).toBe(1n);
  });

  test('converts maximum value', () => {
    const result = Uint64.toBigInt('0xffffffffffffffff' as Uint64.Uint64);
    expect(result).toBe(18446744073709551615n);
  });

  test('converts arbitrary value', () => {
    const result = Uint64.toBigInt('0x2a' as Uint64.Uint64);
    expect(result).toBe(42n);
  });
});

describe('Uint64.fromNumber', () => {
  test('converts zero', () => {
    const result = Uint64.fromNumber(0);
    expect(result).toBe('0x0');
  });

  test('converts one', () => {
    const result = Uint64.fromNumber(1);
    expect(result).toBe('0x1');
  });

  test('converts arbitrary value', () => {
    const result = Uint64.fromNumber(42);
    expect(result).toBe('0x2a');
  });

  test('converts Number.MAX_SAFE_INTEGER', () => {
    const result = Uint64.fromNumber(Number.MAX_SAFE_INTEGER);
    expect(Uint64.toBigInt(result)).toBe(BigInt(Number.MAX_SAFE_INTEGER));
  });

  test('throws on negative value', () => {
    expect(() => Uint64.fromNumber(-1)).toThrow('negative');
  });

  test('throws on non-integer', () => {
    expect(() => Uint64.fromNumber(1.5)).toThrow('not a safe integer');
  });

  test('throws on NaN', () => {
    expect(() => Uint64.fromNumber(NaN)).toThrow('not a safe integer');
  });

  test('throws on Infinity', () => {
    expect(() => Uint64.fromNumber(Infinity)).toThrow('not a safe integer');
  });
});

describe('Uint64.toNumber', () => {
  test('converts zero', () => {
    const result = Uint64.toNumber('0x0' as Uint64.Uint64);
    expect(result).toBe(0);
  });

  test('converts one', () => {
    const result = Uint64.toNumber('0x1' as Uint64.Uint64);
    expect(result).toBe(1);
  });

  test('converts arbitrary value', () => {
    const result = Uint64.toNumber('0x2a' as Uint64.Uint64);
    expect(result).toBe(42);
  });

  test('converts Number.MAX_SAFE_INTEGER', () => {
    const value = Uint64.fromBigInt(BigInt(Number.MAX_SAFE_INTEGER));
    const result = Uint64.toNumber(value);
    expect(result).toBe(Number.MAX_SAFE_INTEGER);
  });

  test('throws on value exceeding MAX_SAFE_INTEGER', () => {
    const value = Uint64.fromBigInt(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
    expect(() => Uint64.toNumber(value)).toThrow('exceeds Number.MAX_SAFE_INTEGER');
  });

  test('throws on UINT64_MAX', () => {
    expect(() => Uint64.toNumber(Uint64.UINT64_MAX)).toThrow('exceeds Number.MAX_SAFE_INTEGER');
  });
});

describe('Uint64.add', () => {
  test('adds zero + zero', () => {
    const result = Uint64.add(Uint64.UINT64_ZERO, Uint64.UINT64_ZERO);
    expect(Uint64.toBigInt(result)).toBe(0n);
  });

  test('adds one + one', () => {
    const result = Uint64.add(Uint64.UINT64_ONE, Uint64.UINT64_ONE);
    expect(Uint64.toBigInt(result)).toBe(2n);
  });

  test('adds arbitrary values', () => {
    const a = Uint64.fromBigInt(100n);
    const b = Uint64.fromBigInt(200n);
    const result = Uint64.add(a, b);
    expect(Uint64.toBigInt(result)).toBe(300n);
  });

  test('throws on overflow', () => {
    const almostMax = Uint64.fromBigInt(18446744073709551614n);
    const two = Uint64.fromBigInt(2n);
    expect(() => Uint64.add(almostMax, two)).toThrow('overflow');
  });
});

describe('Uint64.sub', () => {
  test('subtracts zero - zero', () => {
    const result = Uint64.sub(Uint64.UINT64_ZERO, Uint64.UINT64_ZERO);
    expect(Uint64.toBigInt(result)).toBe(0n);
  });

  test('subtracts one - one', () => {
    const result = Uint64.sub(Uint64.UINT64_ONE, Uint64.UINT64_ONE);
    expect(Uint64.toBigInt(result)).toBe(0n);
  });

  test('subtracts arbitrary values', () => {
    const a = Uint64.fromBigInt(300n);
    const b = Uint64.fromBigInt(100n);
    const result = Uint64.sub(a, b);
    expect(Uint64.toBigInt(result)).toBe(200n);
  });

  test('throws on underflow', () => {
    const one = Uint64.UINT64_ONE;
    const two = Uint64.fromBigInt(2n);
    expect(() => Uint64.sub(one, two)).toThrow('underflow');
  });
});

describe('Uint64.mul', () => {
  test('multiplies zero * zero', () => {
    const result = Uint64.mul(Uint64.UINT64_ZERO, Uint64.UINT64_ZERO);
    expect(Uint64.toBigInt(result)).toBe(0n);
  });

  test('multiplies one * one', () => {
    const result = Uint64.mul(Uint64.UINT64_ONE, Uint64.UINT64_ONE);
    expect(Uint64.toBigInt(result)).toBe(1n);
  });

  test('multiplies arbitrary values', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(20n);
    const result = Uint64.mul(a, b);
    expect(Uint64.toBigInt(result)).toBe(200n);
  });

  test('throws on overflow', () => {
    const large = Uint64.fromBigInt(9223372036854775808n); // 2^63
    const two = Uint64.fromBigInt(2n);
    expect(() => Uint64.mul(large, two)).toThrow('overflow');
  });
});

describe('Uint64.div', () => {
  test('divides one / one', () => {
    const result = Uint64.div(Uint64.UINT64_ONE, Uint64.UINT64_ONE);
    expect(Uint64.toBigInt(result)).toBe(1n);
  });

  test('divides arbitrary values', () => {
    const a = Uint64.fromBigInt(200n);
    const b = Uint64.fromBigInt(10n);
    const result = Uint64.div(a, b);
    expect(Uint64.toBigInt(result)).toBe(20n);
  });

  test('performs integer division', () => {
    const a = Uint64.fromBigInt(7n);
    const b = Uint64.fromBigInt(2n);
    const result = Uint64.div(a, b);
    expect(Uint64.toBigInt(result)).toBe(3n);
  });

  test('throws on division by zero', () => {
    expect(() => Uint64.div(Uint64.UINT64_ONE, Uint64.UINT64_ZERO)).toThrow('Division by zero');
  });
});

describe('Uint64.mod', () => {
  test('modulo one % one', () => {
    const result = Uint64.mod(Uint64.UINT64_ONE, Uint64.UINT64_ONE);
    expect(Uint64.toBigInt(result)).toBe(0n);
  });

  test('modulo arbitrary values', () => {
    const a = Uint64.fromBigInt(7n);
    const b = Uint64.fromBigInt(3n);
    const result = Uint64.mod(a, b);
    expect(Uint64.toBigInt(result)).toBe(1n);
  });

  test('throws on modulo by zero', () => {
    expect(() => Uint64.mod(Uint64.UINT64_ONE, Uint64.UINT64_ZERO)).toThrow('Modulo by zero');
  });
});

describe('Uint64.compare', () => {
  test('compares equal values', () => {
    const a = Uint64.fromBigInt(42n);
    const b = Uint64.fromBigInt(42n);
    expect(Uint64.compare(a, b)).toBe(0);
  });

  test('compares less than', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(20n);
    expect(Uint64.compare(a, b)).toBe(-1);
  });

  test('compares greater than', () => {
    const a = Uint64.fromBigInt(20n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.compare(a, b)).toBe(1);
  });
});

describe('Uint64.eq', () => {
  test('returns true for equal values', () => {
    const a = Uint64.fromBigInt(42n);
    const b = Uint64.fromBigInt(42n);
    expect(Uint64.eq(a, b)).toBe(true);
  });

  test('returns false for unequal values', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(20n);
    expect(Uint64.eq(a, b)).toBe(false);
  });
});

describe('Uint64.lt', () => {
  test('returns true when a < b', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(20n);
    expect(Uint64.lt(a, b)).toBe(true);
  });

  test('returns false when a >= b', () => {
    const a = Uint64.fromBigInt(20n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.lt(a, b)).toBe(false);
  });

  test('returns false when equal', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.lt(a, b)).toBe(false);
  });
});

describe('Uint64.gt', () => {
  test('returns true when a > b', () => {
    const a = Uint64.fromBigInt(20n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.gt(a, b)).toBe(true);
  });

  test('returns false when a <= b', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(20n);
    expect(Uint64.gt(a, b)).toBe(false);
  });

  test('returns false when equal', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.gt(a, b)).toBe(false);
  });
});

describe('Uint64.lte', () => {
  test('returns true when a < b', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(20n);
    expect(Uint64.lte(a, b)).toBe(true);
  });

  test('returns true when equal', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.lte(a, b)).toBe(true);
  });

  test('returns false when a > b', () => {
    const a = Uint64.fromBigInt(20n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.lte(a, b)).toBe(false);
  });
});

describe('Uint64.gte', () => {
  test('returns true when a > b', () => {
    const a = Uint64.fromBigInt(20n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.gte(a, b)).toBe(true);
  });

  test('returns true when equal', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.gte(a, b)).toBe(true);
  });

  test('returns false when a < b', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(20n);
    expect(Uint64.gte(a, b)).toBe(false);
  });
});

describe('Uint64.min', () => {
  test('returns first when it is smaller', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(20n);
    expect(Uint64.toBigInt(Uint64.min(a, b))).toBe(10n);
  });

  test('returns second when it is smaller', () => {
    const a = Uint64.fromBigInt(20n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.toBigInt(Uint64.min(a, b))).toBe(10n);
  });

  test('returns either when equal', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.toBigInt(Uint64.min(a, b))).toBe(10n);
  });
});

describe('Uint64.max', () => {
  test('returns first when it is larger', () => {
    const a = Uint64.fromBigInt(20n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.toBigInt(Uint64.max(a, b))).toBe(20n);
  });

  test('returns second when it is larger', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(20n);
    expect(Uint64.toBigInt(Uint64.max(a, b))).toBe(20n);
  });

  test('returns either when equal', () => {
    const a = Uint64.fromBigInt(10n);
    const b = Uint64.fromBigInt(10n);
    expect(Uint64.toBigInt(Uint64.max(a, b))).toBe(10n);
  });
});

describe('Uint64.isUint64', () => {
  test('returns true for valid Uint64', () => {
    expect(Uint64.isUint64('0x0')).toBe(true);
    expect(Uint64.isUint64('0x1')).toBe(true);
    expect(Uint64.isUint64('0xffffffffffffffff')).toBe(true);
  });

  test('returns false for invalid format', () => {
    expect(Uint64.isUint64('0')).toBe(false);
    expect(Uint64.isUint64('0xg')).toBe(false);
    expect(Uint64.isUint64('not-hex')).toBe(false);
  });

  test('returns false for non-string', () => {
    expect(Uint64.isUint64(123)).toBe(false);
    expect(Uint64.isUint64(null)).toBe(false);
    expect(Uint64.isUint64(undefined)).toBe(false);
  });

  test('returns false for out-of-range values', () => {
    expect(Uint64.isUint64('0x10000000000000000')).toBe(false); // 2^64
  });
});
