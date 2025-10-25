/**
 * Branded Bytes types for hex-encoded byte arrays
 *
 * - Bytes: Variable-length hex-encoded byte array (even number of hex chars)
 * - Byte: Single byte (1-2 hex characters)
 */

/**
 * Branded type for variable-length byte arrays as hex strings
 * Pattern: ^0x[0-9a-f]*$ (even number of hex chars)
 */
export type Bytes = `0x${string}` & { readonly __brand: 'Bytes' };

/**
 * Branded type for a single byte as hex string
 * Pattern: ^0x[0-9a-fA-F]{0,2}$ (0x, 0x0, 0x00, 0xff, etc.)
 */
export type Byte = `0x${string}` & { readonly __brand: 'Byte' };

/**
 * Regular expression for validating Bytes format
 * Matches: 0x, 0x00, 0xff, 0x1234, 0xabcdef
 * Requires even number of hex characters
 */
const BYTES_PATTERN = /^0x([0-9a-f]{2})*$/;

/**
 * Regular expression for validating Byte format
 * Matches: 0x, 0x0, 0x00, 0xff
 * Allows 0-2 hex characters (can be odd for partial byte like 0x0)
 */
const BYTE_PATTERN = /^0x[0-9a-f]{0,2}$/;

/**
 * Validates if a hex string is valid Bytes format
 * @param hex - Hex string to validate
 * @returns true if valid Bytes format
 */
function isValidBytesHex(hex: string): boolean {
	return BYTES_PATTERN.test(hex);
}

/**
 * Validates if a hex string is valid Byte format
 * @param hex - Hex string to validate
 * @returns true if valid Byte format
 */
function isValidByteHex(hex: string): boolean {
	return BYTE_PATTERN.test(hex);
}

/**
 * Creates Bytes from a hex string or Uint8Array
 *
 * @param value - Hex string with "0x" prefix or Uint8Array
 * @returns Validated Bytes type
 * @throws Error if invalid format (odd number of hex chars, invalid chars)
 *
 * @example
 * ```typescript
 * Bytes("0x")          // "0x" (empty bytes)
 * Bytes("0x00")        // "0x00"
 * Bytes("0xff")        // "0xff"
 * Bytes("0x1234")      // "0x1234"
 * Bytes(new Uint8Array([0xff, 0xaa])) // "0xffaa"
 * Bytes("0x1")         // Error: odd length
 * Bytes("0xgg")        // Error: invalid chars
 * ```
 */
export function Bytes(value: `0x${string}` | Uint8Array): Bytes {
	let hex: string;

	if (value instanceof Uint8Array) {
		// Convert Uint8Array to hex
		hex = `0x${Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('')}`;
	} else {
		hex = value.toLowerCase();
	}

	if (!isValidBytesHex(hex)) {
		const hexPart = hex.slice(2);
		if (hexPart.length % 2 !== 0) {
			throw new Error(
				`Invalid Bytes format: ${hex}. Hex string must have even number of characters (got ${hexPart.length})`
			);
		}
		throw new Error(
			`Invalid Bytes format: ${hex}. Must match pattern ^0x[0-9a-f]*$ (lowercase hex only)`
		);
	}

	return hex as Bytes;
}

/**
 * Creates Byte from a hex string or number
 *
 * @param value - Hex string with "0x" prefix or number (0-255)
 * @returns Validated Byte type
 * @throws Error if invalid format or out of range
 *
 * @example
 * ```typescript
 * Byte("0x")      // "0x" (can be used as zero in some contexts)
 * Byte("0x0")     // "0x0"
 * Byte("0x00")    // "0x00"
 * Byte("0xff")    // "0xff"
 * Byte(255)       // "0xff"
 * Byte(0)         // "0x00"
 * Byte("0x100")   // Error: too long
 * Byte(256)       // Error: out of range
 * ```
 */
export function Byte(value: `0x${string}` | number): Byte {
	let hex: string;

	if (typeof value === 'number') {
		if (!Number.isInteger(value)) {
			throw new Error(`Byte must be an integer, got ${value}`);
		}
		if (value < 0 || value > 255) {
			throw new Error(`Byte must be in range 0-255, got ${value}`);
		}
		hex = `0x${value.toString(16).padStart(2, '0')}`;
	} else {
		hex = value.toLowerCase();
	}

	if (!isValidByteHex(hex)) {
		throw new Error(
			`Invalid Byte format: ${hex}. Must be 0x followed by 0-2 hex characters`
		);
	}

	return hex as Byte;
}

/**
 * Type guard to check if a value is Bytes
 * @param value - Value to check
 * @returns true if value is valid Bytes
 */
export function isBytes(value: unknown): value is Bytes {
	return typeof value === 'string' && isValidBytesHex(value);
}

/**
 * Type guard to check if a value is Byte
 * @param value - Value to check
 * @returns true if value is valid Byte
 */
export function isByte(value: unknown): value is Byte {
	return typeof value === 'string' && isValidByteHex(value);
}

/**
 * Converts Bytes to Uint8Array
 * @param bytes - Bytes to convert
 * @returns Uint8Array representation
 */
export function bytesToUint8Array(bytes: Bytes): Uint8Array {
	const hex = bytes.slice(2);
	if (hex.length === 0) {
		return new Uint8Array(0);
	}

	const result = new Uint8Array(hex.length / 2);
	for (let i = 0; i < result.length; i++) {
		result[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return result;
}

/**
 * Converts Byte to number
 * @param byte - Byte to convert
 * @returns Number representation (0-255)
 */
export function byteToNumber(byte: Byte): number {
	const hex = byte.slice(2);
	if (hex.length === 0) {
		return 0;
	}
	return parseInt(hex, 16);
}

/**
 * Gets the length in bytes of a Bytes value
 * @param bytes - Bytes to measure
 * @returns Number of bytes
 */
export function bytesLength(bytes: Bytes): number {
	return (bytes.length - 2) / 2;
}

/**
 * Concatenates multiple Bytes values
 * @param parts - Bytes values to concatenate
 * @returns Concatenated Bytes
 */
export function concatBytes(...parts: Bytes[]): Bytes {
	const hex = parts.map(b => b.slice(2)).join('');
	return `0x${hex}` as Bytes;
}

/**
 * Slices a Bytes value
 * @param bytes - Bytes to slice
 * @param start - Start index (in bytes)
 * @param end - End index (in bytes, optional)
 * @returns Sliced Bytes
 */
export function sliceBytes(bytes: Bytes, start: number, end?: number): Bytes {
	const hex = bytes.slice(2);
	const startHex = start * 2;
	const endHex = end === undefined ? undefined : end * 2;
	return `0x${hex.slice(startHex, endHex)}` as Bytes;
}

/**
 * Common Bytes constants
 */
export const BYTES_EMPTY = Bytes('0x');
export const BYTE_ZERO = Byte(0);
export const BYTE_MAX = Byte(255);
