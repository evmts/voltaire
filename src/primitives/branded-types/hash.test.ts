import { describe, test, expect } from 'bun:test';
import {
	Hash32,
	Bytes32,
	Bytes256,
	isHash32,
	isBytes32,
	isBytes256,
	hash32ToUint8Array,
	bytes32ToUint8Array,
	bytes256ToUint8Array,
	hash32ToBigInt,
	bigIntToHash32,
	fillHash32,
	fillBytes256,
	HASH32_ZERO,
	BYTES32_ZERO,
	BYTES256_ZERO,
} from './hash';

describe('Hash32', () => {
	describe('constructor from hex string', () => {
		test('accepts valid 32-byte hash', () => {
			const hash = '0x' + '00'.repeat(32);
			expect(Hash32(hash as `0x${string}`)).toBe(hash);
		});

		test('accepts all hex characters', () => {
			const hash = '0x' + '0123456789abcdef'.repeat(4);
			expect(Hash32(hash as `0x${string}`)).toBe(hash);
		});

		test('normalizes uppercase to lowercase', () => {
			const upper = '0x' + 'FF'.repeat(32);
			const lower = '0x' + 'ff'.repeat(32);
			expect(Hash32(upper as `0x${string}`)).toBe(lower);
		});

		test('rejects too short', () => {
			expect(() => Hash32('0x1234' as `0x${string}`)).toThrow('exactly 64 hex characters');
		});

		test('rejects too long', () => {
			const tooLong = '0x' + '00'.repeat(33);
			expect(() => Hash32(tooLong as `0x${string}`)).toThrow('exactly 64 hex characters');
		});

		test('rejects invalid characters', () => {
			const invalid = '0x' + 'gg' + '00'.repeat(31);
			expect(() => Hash32(invalid as `0x${string}`)).toThrow('Invalid Hash32 format');
		});

		test('rejects missing 0x prefix', () => {
			const noPrefix = '00'.repeat(32);
			expect(() => Hash32(noPrefix as `0x${string}`)).toThrow('Invalid Hash32 format');
		});

		test('rejects odd length', () => {
			const odd = '0x' + '0'.repeat(63);
			expect(() => Hash32(odd as `0x${string}`)).toThrow('exactly 64 hex characters');
		});
	});

	describe('constructor from Uint8Array', () => {
		test('accepts valid 32-byte array', () => {
			const bytes = new Uint8Array(32);
			const hash = Hash32(bytes);
			expect(hash).toBe('0x' + '00'.repeat(32));
		});

		test('converts bytes correctly', () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xff;
			bytes[31] = 0xaa;
			const hash = Hash32(bytes);
			expect(hash.slice(2, 4)).toBe('ff');
			expect(hash.slice(-2)).toBe('aa');
		});

		test('rejects wrong size', () => {
			expect(() => Hash32(new Uint8Array(31))).toThrow('exactly 32 bytes');
			expect(() => Hash32(new Uint8Array(33))).toThrow('exactly 32 bytes');
			expect(() => Hash32(new Uint8Array(0))).toThrow('exactly 32 bytes');
		});

		test('pads single-digit hex', () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0x01;
			bytes[1] = 0x0f;
			const hash = Hash32(bytes);
			expect(hash.slice(2, 6)).toBe('010f');
		});
	});

	describe('isHash32', () => {
		test('returns true for valid Hash32', () => {
			const hash = '0x' + '00'.repeat(32);
			expect(isHash32(hash)).toBe(true);
		});

		test('returns false for invalid length', () => {
			expect(isHash32('0x1234')).toBe(false);
			expect(isHash32('0x' + '00'.repeat(33))).toBe(false);
		});

		test('returns false for invalid format', () => {
			expect(isHash32('0x' + 'gg' + '00'.repeat(31))).toBe(false);
			expect(isHash32('00'.repeat(32))).toBe(false);
		});

		test('returns false for non-strings', () => {
			expect(isHash32(null)).toBe(false);
			expect(isHash32(undefined)).toBe(false);
			expect(isHash32(123)).toBe(false);
		});
	});

	describe('hash32ToUint8Array', () => {
		test('converts to bytes', () => {
			const hash = Hash32(('0x' + '00'.repeat(32)) as `0x${string}`);
			const bytes = hash32ToUint8Array(hash);
			expect(bytes).toEqual(new Uint8Array(32));
		});

		test('preserves byte values', () => {
			const original = new Uint8Array(32);
			original[0] = 0xff;
			original[15] = 0x12;
			original[31] = 0xaa;
			const hash = Hash32(original);
			const result = hash32ToUint8Array(hash);
			expect(result).toEqual(original);
		});

		test('roundtrips correctly', () => {
			const original = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				original[i] = i * 8;
			}
			const hash = Hash32(original);
			const result = hash32ToUint8Array(hash);
			expect(result).toEqual(original);
		});
	});

	describe('hash32ToBigInt', () => {
		test('converts zero', () => {
			const hash = Hash32(('0x' + '00'.repeat(32)) as `0x${string}`);
			expect(hash32ToBigInt(hash)).toBe(0n);
		});

		test('converts max value', () => {
			const hash = Hash32(('0x' + 'ff'.repeat(32)) as `0x${string}`);
			expect(hash32ToBigInt(hash)).toBe((1n << 256n) - 1n);
		});

		test('converts specific values', () => {
			const hash = Hash32(('0x' + '00'.repeat(31) + '01') as `0x${string}`);
			expect(hash32ToBigInt(hash)).toBe(1n);

			const hash2 = Hash32(('0x' + '00'.repeat(31) + 'ff') as `0x${string}`);
			expect(hash32ToBigInt(hash2)).toBe(255n);
		});

		test('interprets as big-endian', () => {
			const hash = Hash32(('0x' + '01' + '00'.repeat(31)) as `0x${string}`);
			expect(hash32ToBigInt(hash)).toBe(1n << 248n);
		});
	});

	describe('bigIntToHash32', () => {
		test('converts zero', () => {
			expect(bigIntToHash32(0n)).toBe('0x' + '00'.repeat(32));
		});

		test('converts small values', () => {
			expect(bigIntToHash32(1n)).toBe('0x' + '00'.repeat(31) + '01');
			expect(bigIntToHash32(255n)).toBe('0x' + '00'.repeat(31) + 'ff');
		});

		test('converts max value', () => {
			const max = (1n << 256n) - 1n;
			expect(bigIntToHash32(max)).toBe('0x' + 'ff'.repeat(32));
		});

		test('rejects negative', () => {
			expect(() => bigIntToHash32(-1n)).toThrow('non-negative');
		});

		test('rejects too large', () => {
			const tooBig = 1n << 256n;
			expect(() => bigIntToHash32(tooBig)).toThrow('fit in 256 bits');
		});

		test('roundtrips with hash32ToBigInt', () => {
			const values = [0n, 1n, 255n, 65535n, (1n << 128n) - 1n, (1n << 256n) - 1n];
			for (const value of values) {
				const hash = bigIntToHash32(value);
				expect(hash32ToBigInt(hash)).toBe(value);
			}
		});
	});

	describe('fillHash32', () => {
		test('fills with zero', () => {
			expect(fillHash32(0)).toBe('0x' + '00'.repeat(32));
		});

		test('fills with 0xff', () => {
			expect(fillHash32(255)).toBe('0x' + 'ff'.repeat(32));
		});

		test('fills with specific byte', () => {
			expect(fillHash32(0x42)).toBe('0x' + '42'.repeat(32));
		});

		test('rejects out of range', () => {
			expect(() => fillHash32(-1)).toThrow('range 0-255');
			expect(() => fillHash32(256)).toThrow('range 0-255');
		});

		test('rejects non-integer', () => {
			expect(() => fillHash32(1.5)).toThrow('must be an integer');
		});
	});
});

describe('Bytes32', () => {
	test('is alias for Hash32', () => {
		const value = '0x' + '00'.repeat(32);
		expect(Bytes32(value as `0x${string}`)).toBe(Hash32(value as `0x${string}`));
	});

	test('isBytes32 is alias for isHash32', () => {
		const value = '0x' + '00'.repeat(32);
		expect(isBytes32(value)).toBe(isHash32(value));
	});

	test('bytes32ToUint8Array is alias', () => {
		const hash = Bytes32(('0x' + 'ff'.repeat(32)) as `0x${string}`);
		expect(bytes32ToUint8Array(hash)).toEqual(hash32ToUint8Array(hash));
	});
});

describe('Bytes256', () => {
	describe('constructor from hex string', () => {
		test('accepts valid 256-byte value', () => {
			const bytes = '0x' + '00'.repeat(256);
			expect(Bytes256(bytes as `0x${string}`)).toBe(bytes);
		});

		test('accepts all hex characters', () => {
			const bytes = '0x' + '0123456789abcdef'.repeat(32);
			expect(Bytes256(bytes as `0x${string}`)).toBe(bytes);
		});

		test('normalizes uppercase', () => {
			const upper = '0x' + 'FF'.repeat(256);
			const lower = '0x' + 'ff'.repeat(256);
			expect(Bytes256(upper as `0x${string}`)).toBe(lower);
		});

		test('rejects too short', () => {
			const short = '0x' + '00'.repeat(255);
			expect(() => Bytes256(short as `0x${string}`)).toThrow('exactly 512 hex characters');
		});

		test('rejects too long', () => {
			const long = '0x' + '00'.repeat(257);
			expect(() => Bytes256(long as `0x${string}`)).toThrow('exactly 512 hex characters');
		});
	});

	describe('constructor from Uint8Array', () => {
		test('accepts valid 256-byte array', () => {
			const bytes = new Uint8Array(256);
			expect(Bytes256(bytes)).toBe('0x' + '00'.repeat(256));
		});

		test('rejects wrong size', () => {
			expect(() => Bytes256(new Uint8Array(255))).toThrow('exactly 256 bytes');
			expect(() => Bytes256(new Uint8Array(257))).toThrow('exactly 256 bytes');
		});

		test('converts bytes correctly', () => {
			const bytes = new Uint8Array(256);
			bytes[0] = 0xff;
			bytes[255] = 0xaa;
			const result = Bytes256(bytes);
			expect(result.slice(2, 4)).toBe('ff');
			expect(result.slice(-2)).toBe('aa');
		});
	});

	describe('isBytes256', () => {
		test('returns true for valid Bytes256', () => {
			const bytes = '0x' + '00'.repeat(256);
			expect(isBytes256(bytes)).toBe(true);
		});

		test('returns false for invalid length', () => {
			expect(isBytes256('0x' + '00'.repeat(32))).toBe(false);
			expect(isBytes256('0x1234')).toBe(false);
		});
	});

	describe('bytes256ToUint8Array', () => {
		test('converts to bytes', () => {
			const bytes = Bytes256(('0x' + '00'.repeat(256)) as `0x${string}`);
			const result = bytes256ToUint8Array(bytes);
			expect(result).toEqual(new Uint8Array(256));
		});

		test('roundtrips correctly', () => {
			const original = new Uint8Array(256);
			for (let i = 0; i < 256; i++) {
				original[i] = i % 256;
			}
			const bytes = Bytes256(original);
			const result = bytes256ToUint8Array(bytes);
			expect(result).toEqual(original);
		});
	});

	describe('fillBytes256', () => {
		test('fills with zero', () => {
			expect(fillBytes256(0)).toBe('0x' + '00'.repeat(256));
		});

		test('fills with 0xff', () => {
			expect(fillBytes256(255)).toBe('0x' + 'ff'.repeat(256));
		});

		test('rejects out of range', () => {
			expect(() => fillBytes256(-1)).toThrow('range 0-255');
			expect(() => fillBytes256(256)).toThrow('range 0-255');
		});
	});
});

describe('constants', () => {
	test('HASH32_ZERO', () => {
		expect(HASH32_ZERO).toBe('0x' + '00'.repeat(32));
		expect(isHash32(HASH32_ZERO)).toBe(true);
	});

	test('BYTES32_ZERO', () => {
		expect(BYTES32_ZERO).toBe(HASH32_ZERO);
		expect(isBytes32(BYTES32_ZERO)).toBe(true);
	});

	test('BYTES256_ZERO', () => {
		expect(BYTES256_ZERO).toBe('0x' + '00'.repeat(256));
		expect(isBytes256(BYTES256_ZERO)).toBe(true);
	});
});

describe('edge cases', () => {
	test('Hash32 preserves exact byte representation', () => {
		const bytes = new Uint8Array(32);
		bytes[0] = 0x01;
		bytes[1] = 0x00;
		const hash = Hash32(bytes);
		// Should be 0x01 then 0x00, not trimmed
		expect(hash.slice(2, 6)).toBe('0100');
	});

	test('large values roundtrip correctly', () => {
		const large = (1n << 255n) + 12345n;
		const hash = bigIntToHash32(large);
		expect(hash32ToBigInt(hash)).toBe(large);
	});
});
