import { describe, test, expect } from 'bun:test';
import {
	Uint,
	isUint,
	uintToBigInt,
	UINT_ZERO,
	UINT_ONE,
	UINT_MAX_U8,
	UINT_MAX_U16,
	UINT_MAX_U32,
	UINT_MAX_U64,
	UINT_MAX_U128,
	UINT_MAX_U256
} from './uint';

describe('Uint', () => {
	describe('constructor from hex string', () => {
		test('accepts valid zero', () => {
			expect(Uint('0x0')).toBe('0x0');
		});

		test('accepts valid single digit', () => {
			expect(Uint('0x1')).toBe('0x1');
			expect(Uint('0x9')).toBe('0x9');
			expect(Uint('0xa')).toBe('0xa');
			expect(Uint('0xf')).toBe('0xf');
		});

		test('accepts valid multi-digit', () => {
			expect(Uint('0x10')).toBe('0x10');
			expect(Uint('0xff')).toBe('0xff');
			expect(Uint('0x1234')).toBe('0x1234');
			expect(Uint('0xabcdef')).toBe('0xabcdef');
		});

		test('normalizes uppercase to lowercase', () => {
			expect(Uint('0xFF')).toBe('0xff');
			expect(Uint('0xABCD')).toBe('0xabcd');
			expect(Uint('0X1A2B')).toBe('0x1a2b');
		});

		test('rejects leading zeros', () => {
			expect(() => Uint('0x00')).toThrow('Invalid Uint format');
			expect(() => Uint('0x01')).toThrow('Invalid Uint format');
			expect(() => Uint('0x001')).toThrow('Invalid Uint format');
			expect(() => Uint('0x00ff')).toThrow('Invalid Uint format');
		});

		test('rejects invalid characters', () => {
			expect(() => Uint('0xg')).toThrow('Invalid Uint format');
			expect(() => Uint('0xz')).toThrow('Invalid Uint format');
			expect(() => Uint('0x12g3')).toThrow('Invalid Uint format');
		});

		test('rejects missing 0x prefix', () => {
			expect(() => Uint('ff' as `0x${string}`)).toThrow('Invalid Uint format');
			expect(() => Uint('1234' as `0x${string}`)).toThrow('Invalid Uint format');
		});

		test('rejects empty hex', () => {
			expect(() => Uint('0x')).toThrow('Invalid Uint format');
		});

		test('rejects special characters', () => {
			expect(() => Uint('0x-1')).toThrow('Invalid Uint format');
			expect(() => Uint('0x+1')).toThrow('Invalid Uint format');
			expect(() => Uint('0x 1')).toThrow('Invalid Uint format');
		});
	});

	describe('constructor from bigint', () => {
		test('accepts zero', () => {
			expect(Uint(0n)).toBe('0x0');
		});

		test('accepts positive integers', () => {
			expect(Uint(1n)).toBe('0x1');
			expect(Uint(255n)).toBe('0xff');
			expect(Uint(256n)).toBe('0x100');
			expect(Uint(65535n)).toBe('0xffff');
		});

		test('handles large numbers', () => {
			expect(Uint(0xffffffffn)).toBe('0xffffffff');
			expect(Uint(0xffffffffffffffffn)).toBe('0xffffffffffffffff');
		});

		test('rejects negative numbers', () => {
			expect(() => Uint(-1n)).toThrow('Uint must be non-negative');
			expect(() => Uint(-255n)).toThrow('Uint must be non-negative');
		});

		test('never produces leading zeros', () => {
			const result = Uint(15n);
			expect(result).toBe('0xf');
			expect(result).not.toBe('0x0f');
		});
	});

	describe('isUint', () => {
		test('returns true for valid Uint', () => {
			expect(isUint('0x0')).toBe(true);
			expect(isUint('0x1')).toBe(true);
			expect(isUint('0xff')).toBe(true);
			expect(isUint('0x1234abcd')).toBe(true);
		});

		test('returns false for invalid format', () => {
			expect(isUint('0x00')).toBe(false);
			expect(isUint('0x01')).toBe(false);
			expect(isUint('0xg')).toBe(false);
			expect(isUint('ff')).toBe(false);
			expect(isUint('0x')).toBe(false);
		});

		test('returns false for non-strings', () => {
			expect(isUint(123)).toBe(false);
			expect(isUint(null)).toBe(false);
			expect(isUint(undefined)).toBe(false);
			expect(isUint({})).toBe(false);
		});
	});

	describe('uintToBigInt', () => {
		test('converts zero', () => {
			expect(uintToBigInt(Uint('0x0'))).toBe(0n);
		});

		test('converts small numbers', () => {
			expect(uintToBigInt(Uint('0x1'))).toBe(1n);
			expect(uintToBigInt(Uint('0xff'))).toBe(255n);
		});

		test('converts large numbers', () => {
			expect(uintToBigInt(Uint('0xffffffff'))).toBe(0xffffffffn);
			expect(uintToBigInt(Uint('0xffffffffffffffff'))).toBe(0xffffffffffffffffn);
		});

		test('roundtrips correctly', () => {
			const original = 12345678901234567890n;
			const uint = Uint(original);
			const result = uintToBigInt(uint);
			expect(result).toBe(original);
		});
	});

	describe('constants', () => {
		test('UINT_ZERO', () => {
			expect(UINT_ZERO).toBe('0x0');
			expect(uintToBigInt(UINT_ZERO)).toBe(0n);
		});

		test('UINT_ONE', () => {
			expect(UINT_ONE).toBe('0x1');
			expect(uintToBigInt(UINT_ONE)).toBe(1n);
		});

		test('UINT_MAX_U8', () => {
			expect(uintToBigInt(UINT_MAX_U8)).toBe(0xffn);
		});

		test('UINT_MAX_U16', () => {
			expect(uintToBigInt(UINT_MAX_U16)).toBe(0xffffn);
		});

		test('UINT_MAX_U32', () => {
			expect(uintToBigInt(UINT_MAX_U32)).toBe(0xffffffffn);
		});

		test('UINT_MAX_U64', () => {
			expect(uintToBigInt(UINT_MAX_U64)).toBe(0xffffffffffffffffn);
		});

		test('UINT_MAX_U128', () => {
			expect(uintToBigInt(UINT_MAX_U128)).toBe((1n << 128n) - 1n);
		});

		test('UINT_MAX_U256', () => {
			expect(uintToBigInt(UINT_MAX_U256)).toBe((1n << 256n) - 1n);
		});
	});

	describe('edge cases', () => {
		test('max safe integer', () => {
			const max = BigInt(Number.MAX_SAFE_INTEGER);
			const uint = Uint(max);
			expect(uintToBigInt(uint)).toBe(max);
		});

		test('beyond max safe integer', () => {
			const large = BigInt(Number.MAX_SAFE_INTEGER) * 2n;
			const uint = Uint(large);
			expect(uintToBigInt(uint)).toBe(large);
		});

		test('single hex character boundaries', () => {
			expect(Uint('0xa')).toBe('0xa');
			expect(Uint('0xf')).toBe('0xf');
			expect(Uint(10n)).toBe('0xa');
			expect(Uint(15n)).toBe('0xf');
		});

		test('two hex character boundaries', () => {
			expect(Uint('0x10')).toBe('0x10');
			expect(Uint('0xff')).toBe('0xff');
			expect(Uint(16n)).toBe('0x10');
			expect(Uint(255n)).toBe('0xff');
		});
	});

	describe('type safety', () => {
		test('preserves brand at type level', () => {
			const uint: Uint = Uint('0xff');
			// This should compile - Uint is a string subtype
			const _str: `0x${string}` = uint;
			expect(uint).toBeDefined();
		});

		test('prevents accidental string assignment at runtime', () => {
			const uint = Uint('0xff');
			expect(isUint(uint)).toBe(true);
			expect(isUint('0xff')).toBe(true); // Runtime check is the same
		});
	});
});
