/**
 * Tests for Uint256 utilities
 */

import { describe, test, expect } from 'bun:test';
import * as Uint256 from './uint256';

describe('Uint256 Constants', () => {
  test('ZERO', () => {
    expect(Uint256.toBigInt(Uint256.ZERO)).toBe(0n);
  });

  test('ONE', () => {
    expect(Uint256.toBigInt(Uint256.ONE)).toBe(1n);
  });

  test('MAX_UINT256', () => {
    const expected =
      115792089237316195423570985008687907853269984665640564039457584007913129639935n;
    expect(Uint256.toBigInt(Uint256.MAX_UINT256)).toBe(expected);
  });
});

describe('Uint256.fromBigInt', () => {
  test('converts zero', () => {
    const result = Uint256.fromBigInt(0n);
    expect(result).toBe('0x0');
  });

  test('converts one', () => {
    const result = Uint256.fromBigInt(1n);
    expect(result).toBe('0x1');
  });

  test('converts maximum value', () => {
    const max = (1n << 256n) - 1n;
    const result = Uint256.fromBigInt(max);
    expect(result).toBe('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  });

  test('converts arbitrary value', () => {
    const result = Uint256.fromBigInt(42n);
    expect(result).toBe('0x2a');
  });

  test('throws on negative value', () => {
    expect(() => Uint256.fromBigInt(-1n)).toThrow('below minimum');
  });

  test('throws on value exceeding maximum', () => {
    const overMax = (1n << 256n);
    expect(() => Uint256.fromBigInt(overMax)).toThrow('exceeds maximum');
  });
});

describe('Uint256.toBigInt', () => {
  test('converts zero', () => {
    const result = Uint256.toBigInt('0x0' as Uint256.Uint256);
    expect(result).toBe(0n);
  });

  test('converts one', () => {
    const result = Uint256.toBigInt('0x1' as Uint256.Uint256);
    expect(result).toBe(1n);
  });

  test('converts maximum value', () => {
    const result = Uint256.toBigInt(
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as Uint256.Uint256
    );
    const expected = (1n << 256n) - 1n;
    expect(result).toBe(expected);
  });

  test('converts arbitrary value', () => {
    const result = Uint256.toBigInt('0x2a' as Uint256.Uint256);
    expect(result).toBe(42n);
  });
});

describe('Uint256.fromHex', () => {
  test('accepts hex with 0x prefix', () => {
    const result = Uint256.fromHex('0x2a');
    expect(Uint256.toBigInt(result)).toBe(42n);
  });

  test('accepts hex without 0x prefix', () => {
    const result = Uint256.fromHex('2a');
    expect(Uint256.toBigInt(result)).toBe(42n);
  });

  test('accepts uppercase hex', () => {
    const result = Uint256.fromHex('0x2A');
    expect(Uint256.toBigInt(result)).toBe(42n);
  });

  test('throws on invalid hex characters', () => {
    expect(() => Uint256.fromHex('0xGG')).toThrow('Invalid hex format');
  });

  test('throws on out of range value', () => {
    const overMax = '0x10000000000000000000000000000000000000000000000000000000000000000';
    expect(() => Uint256.fromHex(overMax)).toThrow('out of Uint256 range');
  });
});

describe('Uint256.toHex', () => {
  test('returns value as-is', () => {
    const value = '0x2a' as Uint256.Uint256;
    expect(Uint256.toHex(value)).toBe('0x2a');
  });
});

describe('Uint256.fromBytes', () => {
  test('converts empty bytes to zero', () => {
    const bytes = new Uint8Array([]);
    const result = Uint256.fromBytes(bytes);
    expect(Uint256.toBigInt(result)).toBe(0n);
  });

  test('converts single byte', () => {
    const bytes = new Uint8Array([42]);
    const result = Uint256.fromBytes(bytes);
    expect(Uint256.toBigInt(result)).toBe(42n);
  });

  test('converts multiple bytes (big-endian)', () => {
    const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const result = Uint256.fromBytes(bytes);
    expect(Uint256.toBigInt(result)).toBe(0x01020304n);
  });

  test('converts 32 bytes', () => {
    const bytes = new Uint8Array(32);
    bytes[31] = 0xff;
    const result = Uint256.fromBytes(bytes);
    expect(Uint256.toBigInt(result)).toBe(0xffn);
  });

  test('throws on bytes longer than 32', () => {
    const bytes = new Uint8Array(33);
    expect(() => Uint256.fromBytes(bytes)).toThrow('too large');
  });
});

describe('Uint256.toBytes', () => {
  test('converts zero to 32 zero bytes', () => {
    const result = Uint256.toBytes(Uint256.ZERO);
    expect(result.length).toBe(32);
    expect(result.every((b) => b === 0)).toBe(true);
  });

  test('converts one to bytes', () => {
    const result = Uint256.toBytes(Uint256.ONE);
    expect(result.length).toBe(32);
    expect(result[31]).toBe(1);
    expect(result.slice(0, 31).every((b) => b === 0)).toBe(true);
  });

  test('converts arbitrary value (big-endian)', () => {
    const value = Uint256.fromBigInt(0x01020304n);
    const result = Uint256.toBytes(value);
    expect(result.length).toBe(32);
    expect(result[28]).toBe(0x01);
    expect(result[29]).toBe(0x02);
    expect(result[30]).toBe(0x03);
    expect(result[31]).toBe(0x04);
  });

  test('round-trip bytes conversion', () => {
    const original = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      original[i] = i;
    }
    const value = Uint256.fromBytes(original);
    const result = Uint256.toBytes(value);
    expect(result).toEqual(original);
  });
});

describe('Uint256.add', () => {
  test('adds zero + zero', () => {
    const result = Uint256.add(Uint256.ZERO, Uint256.ZERO);
    expect(Uint256.toBigInt(result)).toBe(0n);
  });

  test('adds one + one', () => {
    const result = Uint256.add(Uint256.ONE, Uint256.ONE);
    expect(Uint256.toBigInt(result)).toBe(2n);
  });

  test('adds arbitrary values', () => {
    const a = Uint256.fromBigInt(100n);
    const b = Uint256.fromBigInt(200n);
    const result = Uint256.add(a, b);
    expect(Uint256.toBigInt(result)).toBe(300n);
  });

  test('throws on overflow', () => {
    const almostMax = Uint256.fromBigInt((1n << 256n) - 2n);
    const two = Uint256.fromBigInt(2n);
    expect(() => Uint256.add(almostMax, two)).toThrow('overflow');
  });
});

describe('Uint256.sub', () => {
  test('subtracts zero - zero', () => {
    const result = Uint256.sub(Uint256.ZERO, Uint256.ZERO);
    expect(Uint256.toBigInt(result)).toBe(0n);
  });

  test('subtracts one - one', () => {
    const result = Uint256.sub(Uint256.ONE, Uint256.ONE);
    expect(Uint256.toBigInt(result)).toBe(0n);
  });

  test('subtracts arbitrary values', () => {
    const a = Uint256.fromBigInt(300n);
    const b = Uint256.fromBigInt(100n);
    const result = Uint256.sub(a, b);
    expect(Uint256.toBigInt(result)).toBe(200n);
  });

  test('throws on underflow', () => {
    const one = Uint256.ONE;
    const two = Uint256.fromBigInt(2n);
    expect(() => Uint256.sub(one, two)).toThrow('underflow');
  });
});

describe('Uint256.mul', () => {
  test('multiplies zero * zero', () => {
    const result = Uint256.mul(Uint256.ZERO, Uint256.ZERO);
    expect(Uint256.toBigInt(result)).toBe(0n);
  });

  test('multiplies one * one', () => {
    const result = Uint256.mul(Uint256.ONE, Uint256.ONE);
    expect(Uint256.toBigInt(result)).toBe(1n);
  });

  test('multiplies arbitrary values', () => {
    const a = Uint256.fromBigInt(10n);
    const b = Uint256.fromBigInt(20n);
    const result = Uint256.mul(a, b);
    expect(Uint256.toBigInt(result)).toBe(200n);
  });

  test('throws on overflow', () => {
    const large = Uint256.fromBigInt(1n << 128n);
    const two = Uint256.fromBigInt(1n << 128n);
    expect(() => Uint256.mul(large, two)).toThrow('overflow');
  });
});

describe('Uint256.div', () => {
  test('divides one / one', () => {
    const result = Uint256.div(Uint256.ONE, Uint256.ONE);
    expect(Uint256.toBigInt(result)).toBe(1n);
  });

  test('divides arbitrary values', () => {
    const a = Uint256.fromBigInt(200n);
    const b = Uint256.fromBigInt(10n);
    const result = Uint256.div(a, b);
    expect(Uint256.toBigInt(result)).toBe(20n);
  });

  test('performs integer division', () => {
    const a = Uint256.fromBigInt(7n);
    const b = Uint256.fromBigInt(2n);
    const result = Uint256.div(a, b);
    expect(Uint256.toBigInt(result)).toBe(3n);
  });

  test('throws on division by zero', () => {
    expect(() => Uint256.div(Uint256.ONE, Uint256.ZERO)).toThrow('Division by zero');
  });
});

describe('Uint256.mod', () => {
  test('modulo one % one', () => {
    const result = Uint256.mod(Uint256.ONE, Uint256.ONE);
    expect(Uint256.toBigInt(result)).toBe(0n);
  });

  test('modulo arbitrary values', () => {
    const a = Uint256.fromBigInt(7n);
    const b = Uint256.fromBigInt(3n);
    const result = Uint256.mod(a, b);
    expect(Uint256.toBigInt(result)).toBe(1n);
  });

  test('throws on modulo by zero', () => {
    expect(() => Uint256.mod(Uint256.ONE, Uint256.ZERO)).toThrow('Modulo by zero');
  });
});

describe('Uint256.pow', () => {
  test('power with zero exponent', () => {
    const base = Uint256.fromBigInt(42n);
    const result = Uint256.pow(base, Uint256.ZERO);
    expect(Uint256.toBigInt(result)).toBe(1n);
  });

  test('power with zero base', () => {
    const exp = Uint256.fromBigInt(5n);
    const result = Uint256.pow(Uint256.ZERO, exp);
    expect(Uint256.toBigInt(result)).toBe(0n);
  });

  test('power with one base', () => {
    const exp = Uint256.fromBigInt(100n);
    const result = Uint256.pow(Uint256.ONE, exp);
    expect(Uint256.toBigInt(result)).toBe(1n);
  });

  test('power of two', () => {
    const base = Uint256.fromBigInt(2n);
    const exp = Uint256.fromBigInt(8n);
    const result = Uint256.pow(base, exp);
    expect(Uint256.toBigInt(result)).toBe(256n);
  });

  test('throws on overflow', () => {
    const base = Uint256.fromBigInt(2n);
    const exp = Uint256.fromBigInt(256n);
    expect(() => Uint256.pow(base, exp)).toThrow('overflow');
  });
});

describe('Uint256.compare', () => {
  test('compares equal values', () => {
    const a = Uint256.fromBigInt(42n);
    const b = Uint256.fromBigInt(42n);
    expect(Uint256.compare(a, b)).toBe(0);
  });

  test('compares less than', () => {
    const a = Uint256.fromBigInt(10n);
    const b = Uint256.fromBigInt(20n);
    expect(Uint256.compare(a, b)).toBe(-1);
  });

  test('compares greater than', () => {
    const a = Uint256.fromBigInt(20n);
    const b = Uint256.fromBigInt(10n);
    expect(Uint256.compare(a, b)).toBe(1);
  });
});

describe('Uint256.eq', () => {
  test('returns true for equal values', () => {
    const a = Uint256.fromBigInt(42n);
    const b = Uint256.fromBigInt(42n);
    expect(Uint256.eq(a, b)).toBe(true);
  });

  test('returns false for unequal values', () => {
    const a = Uint256.fromBigInt(10n);
    const b = Uint256.fromBigInt(20n);
    expect(Uint256.eq(a, b)).toBe(false);
  });
});

describe('Uint256 comparison operations', () => {
  test('lt returns true when a < b', () => {
    const a = Uint256.fromBigInt(10n);
    const b = Uint256.fromBigInt(20n);
    expect(Uint256.lt(a, b)).toBe(true);
  });

  test('gt returns true when a > b', () => {
    const a = Uint256.fromBigInt(20n);
    const b = Uint256.fromBigInt(10n);
    expect(Uint256.gt(a, b)).toBe(true);
  });

  test('lte returns true when a <= b', () => {
    const a = Uint256.fromBigInt(10n);
    const b = Uint256.fromBigInt(10n);
    expect(Uint256.lte(a, b)).toBe(true);
  });

  test('gte returns true when a >= b', () => {
    const a = Uint256.fromBigInt(10n);
    const b = Uint256.fromBigInt(10n);
    expect(Uint256.gte(a, b)).toBe(true);
  });
});

describe('Uint256.min and max', () => {
  test('min returns smaller value', () => {
    const a = Uint256.fromBigInt(10n);
    const b = Uint256.fromBigInt(20n);
    expect(Uint256.toBigInt(Uint256.min(a, b))).toBe(10n);
  });

  test('max returns larger value', () => {
    const a = Uint256.fromBigInt(10n);
    const b = Uint256.fromBigInt(20n);
    expect(Uint256.toBigInt(Uint256.max(a, b))).toBe(20n);
  });
});

describe('Uint256 bitwise operations', () => {
  test('and operation', () => {
    const a = Uint256.fromBigInt(0b1100n);
    const b = Uint256.fromBigInt(0b1010n);
    const result = Uint256.and(a, b);
    expect(Uint256.toBigInt(result)).toBe(0b1000n);
  });

  test('or operation', () => {
    const a = Uint256.fromBigInt(0b1100n);
    const b = Uint256.fromBigInt(0b1010n);
    const result = Uint256.or(a, b);
    expect(Uint256.toBigInt(result)).toBe(0b1110n);
  });

  test('xor operation', () => {
    const a = Uint256.fromBigInt(0b1100n);
    const b = Uint256.fromBigInt(0b1010n);
    const result = Uint256.xor(a, b);
    expect(Uint256.toBigInt(result)).toBe(0b0110n);
  });

  test('not operation', () => {
    const value = Uint256.ZERO;
    const result = Uint256.not(value);
    expect(result).toBe(Uint256.MAX_UINT256);
  });
});

describe('Uint256 shift operations', () => {
  test('left shift by 0', () => {
    const value = Uint256.fromBigInt(42n);
    const result = Uint256.shl(value, 0);
    expect(Uint256.toBigInt(result)).toBe(42n);
  });

  test('left shift by 1', () => {
    const value = Uint256.fromBigInt(1n);
    const result = Uint256.shl(value, 1);
    expect(Uint256.toBigInt(result)).toBe(2n);
  });

  test('left shift by 8', () => {
    const value = Uint256.fromBigInt(1n);
    const result = Uint256.shl(value, 8);
    expect(Uint256.toBigInt(result)).toBe(256n);
  });

  test('throws on left shift overflow', () => {
    const value = Uint256.fromBigInt(1n);
    expect(() => Uint256.shl(value, 256)).toThrow('Shift bits must be 0-255');
  });

  test('throws on left shift with value overflow', () => {
    const value = Uint256.fromBigInt(1n << 255n);
    expect(() => Uint256.shl(value, 1)).toThrow('overflow');
  });

  test('right shift by 0', () => {
    const value = Uint256.fromBigInt(42n);
    const result = Uint256.shr(value, 0);
    expect(Uint256.toBigInt(result)).toBe(42n);
  });

  test('right shift by 1', () => {
    const value = Uint256.fromBigInt(2n);
    const result = Uint256.shr(value, 1);
    expect(Uint256.toBigInt(result)).toBe(1n);
  });

  test('right shift by 8', () => {
    const value = Uint256.fromBigInt(256n);
    const result = Uint256.shr(value, 8);
    expect(Uint256.toBigInt(result)).toBe(1n);
  });

  test('throws on right shift out of range', () => {
    const value = Uint256.fromBigInt(1n);
    expect(() => Uint256.shr(value, 256)).toThrow('Shift bits must be 0-255');
  });
});

describe('Uint256.isUint256', () => {
  test('returns true for valid Uint256', () => {
    expect(Uint256.isUint256('0x0')).toBe(true);
    expect(Uint256.isUint256('0x1')).toBe(true);
    expect(
      Uint256.isUint256('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    ).toBe(true);
  });

  test('returns false for invalid format', () => {
    expect(Uint256.isUint256('0')).toBe(false);
    expect(Uint256.isUint256('0xg')).toBe(false);
    expect(Uint256.isUint256('not-hex')).toBe(false);
  });

  test('returns false for non-string', () => {
    expect(Uint256.isUint256(123)).toBe(false);
    expect(Uint256.isUint256(null)).toBe(false);
    expect(Uint256.isUint256(undefined)).toBe(false);
  });

  test('returns false for out-of-range values', () => {
    expect(
      Uint256.isUint256('0x10000000000000000000000000000000000000000000000000000000000000000')
    ).toBe(false);
  });
});
