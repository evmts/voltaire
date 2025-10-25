import { describe, test, expect } from 'bun:test';
import {
	Bytes,
	Byte,
	isBytes,
	isByte,
	bytesToUint8Array,
	byteToNumber,
	bytesLength,
	concatBytes,
	sliceBytes,
	BYTES_EMPTY,
	BYTE_ZERO,
	BYTE_MAX,
} from './bytes';

describe('Bytes', () => {
	describe('constructor from hex string', () => {
		test('accepts empty bytes', () => {
			expect(Bytes('0x')).toBe('0x');
		});

		test('accepts valid even-length hex', () => {
			expect(Bytes('0x00')).toBe('0x00');
			expect(Bytes('0xff')).toBe('0xff');
			expect(Bytes('0x1234')).toBe('0x1234');
			expect(Bytes('0xabcdef')).toBe('0xabcdef');
		});

		test('accepts long hex strings', () => {
			const long = '0x' + '00'.repeat(100);
			expect(Bytes(long)).toBe(long);
		});

		test('normalizes uppercase to lowercase', () => {
			expect(Bytes('0xFF')).toBe('0xff');
			expect(Bytes('0xABCD')).toBe('0xabcd');
		});

		test('rejects odd-length hex', () => {
			expect(() => Bytes('0x1')).toThrow('even number of characters');
			expect(() => Bytes('0x123')).toThrow('even number of characters');
			expect(() => Bytes('0xabcde')).toThrow('even number of characters');
		});

		test('rejects invalid characters', () => {
			expect(() => Bytes('0xgg')).toThrow('Invalid Bytes format');
			expect(() => Bytes('0xzz')).toThrow('Invalid Bytes format');
			expect(() => Bytes('0x12g3')).toThrow('Invalid Bytes format');
		});

		test('rejects missing 0x prefix', () => {
			expect(() => Bytes('ff' as `0x${string}`)).toThrow('Invalid Bytes format');
		});
	});

	describe('constructor from Uint8Array', () => {
		test('converts empty array', () => {
			expect(Bytes(new Uint8Array([]))).toBe('0x');
		});

		test('converts single byte', () => {
			expect(Bytes(new Uint8Array([0xff]))).toBe('0xff');
			expect(Bytes(new Uint8Array([0x00]))).toBe('0x00');
		});

		test('converts multiple bytes', () => {
			expect(Bytes(new Uint8Array([0x12, 0x34]))).toBe('0x1234');
			expect(Bytes(new Uint8Array([0xff, 0xaa, 0xbb]))).toBe('0xffaabb');
		});

		test('pads single digit bytes', () => {
			expect(Bytes(new Uint8Array([0x01]))).toBe('0x01');
			expect(Bytes(new Uint8Array([0x0f]))).toBe('0x0f');
		});
	});

	describe('isBytes', () => {
		test('returns true for valid Bytes', () => {
			expect(isBytes('0x')).toBe(true);
			expect(isBytes('0x00')).toBe(true);
			expect(isBytes('0xff')).toBe(true);
			expect(isBytes('0x1234')).toBe(true);
		});

		test('returns false for odd-length hex', () => {
			expect(isBytes('0x1')).toBe(false);
			expect(isBytes('0x123')).toBe(false);
		});

		test('returns false for invalid format', () => {
			expect(isBytes('0xgg')).toBe(false);
			expect(isBytes('ff')).toBe(false);
			expect(isBytes(null)).toBe(false);
		});
	});

	describe('bytesToUint8Array', () => {
		test('converts empty bytes', () => {
			const result = bytesToUint8Array(Bytes('0x'));
			expect(result).toEqual(new Uint8Array([]));
		});

		test('converts single byte', () => {
			const result = bytesToUint8Array(Bytes('0xff'));
			expect(result).toEqual(new Uint8Array([0xff]));
		});

		test('converts multiple bytes', () => {
			const result = bytesToUint8Array(Bytes('0x1234'));
			expect(result).toEqual(new Uint8Array([0x12, 0x34]));
		});

		test('roundtrips correctly', () => {
			const original = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
			const bytes = Bytes(original);
			const result = bytesToUint8Array(bytes);
			expect(result).toEqual(original);
		});
	});

	describe('bytesLength', () => {
		test('returns 0 for empty bytes', () => {
			expect(bytesLength(Bytes('0x'))).toBe(0);
		});

		test('returns correct length', () => {
			expect(bytesLength(Bytes('0xff'))).toBe(1);
			expect(bytesLength(Bytes('0x1234'))).toBe(2);
			expect(bytesLength(Bytes('0xabcdef'))).toBe(3);
		});
	});

	describe('concatBytes', () => {
		test('concatenates empty bytes', () => {
			expect(concatBytes(Bytes('0x'), Bytes('0x'))).toBe('0x');
		});

		test('concatenates multiple Bytes', () => {
			const a = Bytes('0x12');
			const b = Bytes('0x34');
			const c = Bytes('0x56');
			expect(concatBytes(a, b, c)).toBe('0x123456');
		});

		test('handles empty with non-empty', () => {
			expect(concatBytes(Bytes('0x'), Bytes('0xff'))).toBe('0xff');
			expect(concatBytes(Bytes('0xff'), Bytes('0x'))).toBe('0xff');
		});
	});

	describe('sliceBytes', () => {
		test('slices from start', () => {
			const bytes = Bytes('0x123456');
			expect(sliceBytes(bytes, 1)).toBe('0x3456');
		});

		test('slices with end', () => {
			const bytes = Bytes('0x123456');
			expect(sliceBytes(bytes, 0, 2)).toBe('0x1234');
			expect(sliceBytes(bytes, 1, 2)).toBe('0x34');
		});

		test('slices empty range', () => {
			const bytes = Bytes('0x123456');
			expect(sliceBytes(bytes, 1, 1)).toBe('0x');
		});
	});
});

describe('Byte', () => {
	describe('constructor from hex string', () => {
		test('accepts empty', () => {
			expect(Byte('0x')).toBe('0x');
		});

		test('accepts single hex char', () => {
			expect(Byte('0x0')).toBe('0x0');
			expect(Byte('0xa')).toBe('0xa');
			expect(Byte('0xf')).toBe('0xf');
		});

		test('accepts two hex chars', () => {
			expect(Byte('0x00')).toBe('0x00');
			expect(Byte('0xff')).toBe('0xff');
			expect(Byte('0x12')).toBe('0x12');
		});

		test('normalizes uppercase', () => {
			expect(Byte('0xFF')).toBe('0xff');
			expect(Byte('0xAB')).toBe('0xab');
		});

		test('rejects more than 2 hex chars', () => {
			expect(() => Byte('0x123')).toThrow('Invalid Byte format');
			expect(() => Byte('0xffff')).toThrow('Invalid Byte format');
		});

		test('rejects invalid characters', () => {
			expect(() => Byte('0xg')).toThrow('Invalid Byte format');
			expect(() => Byte('0xzz')).toThrow('Invalid Byte format');
		});
	});

	describe('constructor from number', () => {
		test('accepts zero', () => {
			expect(Byte(0)).toBe('0x00');
		});

		test('accepts valid range', () => {
			expect(Byte(1)).toBe('0x01');
			expect(Byte(15)).toBe('0x0f');
			expect(Byte(16)).toBe('0x10');
			expect(Byte(255)).toBe('0xff');
		});

		test('pads to 2 digits', () => {
			expect(Byte(1)).toBe('0x01');
			expect(Byte(15)).toBe('0x0f');
		});

		test('rejects out of range', () => {
			expect(() => Byte(-1)).toThrow('range 0-255');
			expect(() => Byte(256)).toThrow('range 0-255');
			expect(() => Byte(1000)).toThrow('range 0-255');
		});

		test('rejects non-integers', () => {
			expect(() => Byte(1.5)).toThrow('must be an integer');
			expect(() => Byte(255.1)).toThrow('must be an integer');
		});
	});

	describe('isByte', () => {
		test('returns true for valid Byte', () => {
			expect(isByte('0x')).toBe(true);
			expect(isByte('0x0')).toBe(true);
			expect(isByte('0x00')).toBe(true);
			expect(isByte('0xff')).toBe(true);
		});

		test('returns false for invalid format', () => {
			expect(isByte('0x123')).toBe(false);
			expect(isByte('0xgg')).toBe(false);
			expect(isByte('ff')).toBe(false);
			expect(isByte(null)).toBe(false);
		});
	});

	describe('byteToNumber', () => {
		test('converts empty to 0', () => {
			expect(byteToNumber(Byte('0x'))).toBe(0);
		});

		test('converts single hex char', () => {
			expect(byteToNumber(Byte('0x0'))).toBe(0);
			expect(byteToNumber(Byte('0xa'))).toBe(10);
			expect(byteToNumber(Byte('0xf'))).toBe(15);
		});

		test('converts two hex chars', () => {
			expect(byteToNumber(Byte('0x00'))).toBe(0);
			expect(byteToNumber(Byte('0x10'))).toBe(16);
			expect(byteToNumber(Byte('0xff'))).toBe(255);
		});

		test('roundtrips correctly', () => {
			for (let i = 0; i <= 255; i++) {
				const byte = Byte(i);
				expect(byteToNumber(byte)).toBe(i);
			}
		});
	});

	describe('constants', () => {
		test('BYTE_ZERO', () => {
			expect(BYTE_ZERO).toBe('0x00');
			expect(byteToNumber(BYTE_ZERO)).toBe(0);
		});

		test('BYTE_MAX', () => {
			expect(BYTE_MAX).toBe('0xff');
			expect(byteToNumber(BYTE_MAX)).toBe(255);
		});
	});
});

describe('Bytes constants', () => {
	test('BYTES_EMPTY', () => {
		expect(BYTES_EMPTY).toBe('0x');
		expect(bytesLength(BYTES_EMPTY)).toBe(0);
	});
});

describe('edge cases', () => {
	test('Bytes handles leading zeros', () => {
		expect(Bytes('0x00')).toBe('0x00');
		expect(Bytes('0x0000')).toBe('0x0000');
	});

	test('Byte preserves format', () => {
		expect(Byte('0x0')).toBe('0x0');
		expect(Byte('0x00')).toBe('0x00');
		// But number conversion always pads to 2
		expect(Byte(0)).toBe('0x00');
	});

	test('type relationships', () => {
		// Byte can be used as Bytes conceptually, but types are distinct
		const byte = Byte('0xff');
		const bytes = Bytes('0xff');
		expect(byte).toBe(bytes);
		// But they have different type brands at compile time
	});
});
