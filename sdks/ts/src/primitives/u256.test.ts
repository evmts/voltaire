import { describe, it, expect } from 'bun:test';
import { U256 } from './u256';

describe('U256', () => {
  describe('creation', () => {
    it('should create U256 from number', () => {
      const u = U256.fromNumber(42);
      expect(u.toNumber()).toBe(42);
      expect(u.toString()).toBe('42');
    });

    it('should create U256 from bigint', () => {
      const big = 123456789012345678901234567890n;
      const u = U256.fromBigInt(big);
      expect(u.toBigInt()).toBe(big);
    });

    it('should create U256 from hex', () => {
      const u = U256.fromHex('0x2A');
      expect(u.toNumber()).toBe(42);
      expect(u.toHex()).toBe('0x2a');
    });

    it('should create U256 from hex without 0x prefix', () => {
      const u = U256.fromHex('2A');
      expect(u.toNumber()).toBe(42);
    });

    it('should create U256 from bytes', () => {
      const bytes = new Uint8Array(32);
      bytes[31] = 42; // Last byte (little-endian style)
      const u = U256.fromBytes(bytes);
      expect(u.toNumber()).toBe(42);
    });

    it('should create zero U256', () => {
      const u = U256.zero();
      expect(u.isZero()).toBe(true);
      expect(u.toNumber()).toBe(0);
    });

    it('should create one U256', () => {
      const u = U256.one();
      expect(u.toNumber()).toBe(1);
    });

    it('should create max U256', () => {
      const u = U256.max();
      expect(u.toBigInt()).toBe(2n ** 256n - 1n);
    });

    it('should throw on negative number', () => {
      expect(() => U256.fromNumber(-1)).toThrow('non-negative');
    });

    it('should throw on non-integer', () => {
      expect(() => U256.fromNumber(3.14)).toThrow('integer');
    });

    it('should throw on negative bigint', () => {
      expect(() => U256.fromBigInt(-1n)).toThrow('cannot be negative');
    });

    it('should throw on too large bigint', () => {
      expect(() => U256.fromBigInt(2n ** 256n)).toThrow('too large');
    });

    it('should throw on invalid hex', () => {
      expect(() => U256.fromHex('0xGG')).toThrow();
    });

    it('should throw on too large hex', () => {
      expect(() => U256.fromHex('0x' + '1'.repeat(65))).toThrow();
    });
  });

  describe('conversions', () => {
    const testValue = U256.fromNumber(12345);

    it('should convert to number', () => {
      expect(testValue.toNumber()).toBe(12345);
      expect(testValue.tryToNumber()).toBe(12345);
    });

    it('should throw on too large for number', () => {
      const large = U256.fromBigInt(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
      expect(() => large.toNumber()).toThrow('too large');
      expect(large.tryToNumber()).toBeNull();
    });

    it('should convert to hex', () => {
      expect(testValue.toHex()).toBe('0x3039');
      expect(testValue.toHexPadded()).toBe('0x0000000000000000000000000000000000000000000000000000000000003039');
    });

    it('should convert to bytes', () => {
      const bytes = testValue.toBytes();
      expect(bytes).toHaveLength(32);
      // Check that the value is in the correct position (big-endian)
      expect(bytes[30]).toBe(0x30);
      expect(bytes[31]).toBe(0x39);
    });

    it('should handle zero correctly', () => {
      const zero = U256.zero();
      expect(zero.toHex()).toBe('0x0');
      expect(zero.toString()).toBe('0');
      expect(zero.toNumber()).toBe(0);
    });
  });

  describe('comparisons', () => {
    const small = U256.fromNumber(10);
    const medium = U256.fromNumber(20);
    const large = U256.fromNumber(30);
    const duplicate = U256.fromNumber(20);

    it('should compare equality', () => {
      expect(medium.equals(duplicate)).toBe(true);
      expect(medium.equals(small)).toBe(false);
    });

    it('should compare less than', () => {
      expect(small.lt(medium)).toBe(true);
      expect(medium.lt(small)).toBe(false);
      expect(medium.lt(duplicate)).toBe(false);
    });

    it('should compare less than or equal', () => {
      expect(small.lte(medium)).toBe(true);
      expect(medium.lte(small)).toBe(false);
      expect(medium.lte(duplicate)).toBe(true);
    });

    it('should compare greater than', () => {
      expect(large.gt(medium)).toBe(true);
      expect(medium.gt(large)).toBe(false);
      expect(medium.gt(duplicate)).toBe(false);
    });

    it('should compare greater than or equal', () => {
      expect(large.gte(medium)).toBe(true);
      expect(medium.gte(large)).toBe(false);
      expect(medium.gte(duplicate)).toBe(true);
    });
  });

  describe('arithmetic', () => {
    const a = U256.fromNumber(10);
    const b = U256.fromNumber(20);

    it('should add correctly', () => {
      const result = a.add(b);
      expect(result.toNumber()).toBe(30);
    });

    it('should subtract correctly', () => {
      const result = b.sub(a);
      expect(result.toNumber()).toBe(10);
    });

    it('should multiply correctly', () => {
      const result = a.mul(b);
      expect(result.toNumber()).toBe(200);
    });

    it('should divide correctly', () => {
      const result = b.div(a);
      expect(result.toNumber()).toBe(2);
    });

    it('should calculate modulo correctly', () => {
      const c = U256.fromNumber(23);
      const result = c.mod(a);
      expect(result.toNumber()).toBe(3);
    });

    it('should throw on overflow', () => {
      const max = U256.max();
      expect(() => max.add(U256.one())).toThrow('overflow');
    });

    it('should throw on underflow', () => {
      expect(() => a.sub(b)).toThrow('underflow');
    });

    it('should throw on division by zero', () => {
      expect(() => a.div(U256.zero())).toThrow('division by zero');
    });

    it('should throw on modulo by zero', () => {
      expect(() => a.mod(U256.zero())).toThrow('modulo by zero');
    });
  });

  describe('bitwise operations', () => {
    const a = U256.fromNumber(0b1010); // 10
    const b = U256.fromNumber(0b1100); // 12

    it('should perform AND', () => {
      const result = a.and(b);
      expect(result.toNumber()).toBe(0b1000); // 8
    });

    it('should perform OR', () => {
      const result = a.or(b);
      expect(result.toNumber()).toBe(0b1110); // 14
    });

    it('should perform XOR', () => {
      const result = a.xor(b);
      expect(result.toNumber()).toBe(0b0110); // 6
    });

    it('should perform NOT', () => {
      const zero = U256.zero();
      const result = zero.not();
      expect(result.equals(U256.max())).toBe(true);
    });

    it('should perform left shift', () => {
      const result = a.shl(1);
      expect(result.toNumber()).toBe(20);
    });

    it('should perform right shift', () => {
      const result = a.shr(1);
      expect(result.toNumber()).toBe(5);
    });

    it('should throw on invalid shift amount', () => {
      expect(() => a.shl(-1)).toThrow('out of range');
      expect(() => a.shl(256)).toThrow('out of range');
      expect(() => a.shr(-1)).toThrow('out of range');
      expect(() => a.shr(256)).toThrow('out of range');
    });
  });

  describe('JSON serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const original = U256.fromNumber(12345);
      const json = original.toJSON();
      const restored = U256.fromJSON(json);
      expect(restored.equals(original)).toBe(true);
    });
  });
});