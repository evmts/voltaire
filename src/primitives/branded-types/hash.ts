/**
 * Branded Hash types for fixed-size hex-encoded hashes
 *
 * - Hash32/Bytes32: 32-byte hash (66 chars: 0x + 64 hex)
 * - Bytes256: 256-byte value (514 chars: 0x + 512 hex)
 */

/**
 * Branded type for 32-byte hash (Keccak256, SHA256, etc.)
 * Exactly 66 characters: "0x" + 64 hex digits
 */
export type Hash32 = `0x${string}` & { readonly __brand: 'Hash32' };

/**
 * Alias for Hash32 (same as 32-byte hash)
 */
export type Bytes32 = Hash32;

/**
 * Branded type for 256-byte value
 * Exactly 514 characters: "0x" + 512 hex digits
 */
export type Bytes256 = `0x${string}` & { readonly __brand: 'Bytes256' };

/**
 * Regular expression for validating Hash32/Bytes32 format
 * Exactly 64 hex characters after "0x"
 */
const HASH32_PATTERN = /^0x[0-9a-f]{64}$/;

/**
 * Regular expression for validating Bytes256 format
 * Exactly 512 hex characters after "0x"
 */
const BYTES256_PATTERN = /^0x[0-9a-f]{512}$/;

/**
 * Validates if a hex string is valid Hash32 format
 * @param hex - Hex string to validate
 * @returns true if valid Hash32 format
 */
function isValidHash32Hex(hex: string): boolean {
	return HASH32_PATTERN.test(hex);
}

/**
 * Validates if a hex string is valid Bytes256 format
 * @param hex - Hex string to validate
 * @returns true if valid Bytes256 format
 */
function isValidBytes256Hex(hex: string): boolean {
	return BYTES256_PATTERN.test(hex);
}

/**
 * Creates Hash32 from a hex string or Uint8Array
 *
 * @param value - Hex string with "0x" prefix or 32-byte Uint8Array
 * @returns Validated Hash32 type
 * @throws Error if not exactly 32 bytes
 *
 * @example
 * ```typescript
 * Hash32("0x" + "00".repeat(32))  // Valid 32-byte hash
 * Hash32(new Uint8Array(32))      // Valid from bytes
 * Hash32("0x1234")                // Error: not 32 bytes
 * ```
 */
export function Hash32(value: `0x${string}` | Uint8Array): Hash32 {
	let hex: string;

	if (value instanceof Uint8Array) {
		if (value.length !== 32) {
			throw new Error(`Hash32 must be exactly 32 bytes, got ${value.length}`);
		}
		hex = `0x${Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('')}`;
	} else {
		hex = value.toLowerCase();
	}

	if (!isValidHash32Hex(hex)) {
		const hexPart = hex.slice(2);
		throw new Error(
			`Invalid Hash32 format: ${hex}. Must be exactly 64 hex characters (32 bytes), got ${hexPart.length} characters`
		);
	}

	return hex as Hash32;
}

/**
 * Alias for Hash32 constructor
 */
export const Bytes32 = Hash32;

/**
 * Creates Bytes256 from a hex string or Uint8Array
 *
 * @param value - Hex string with "0x" prefix or 256-byte Uint8Array
 * @returns Validated Bytes256 type
 * @throws Error if not exactly 256 bytes
 *
 * @example
 * ```typescript
 * Bytes256("0x" + "00".repeat(256))  // Valid 256-byte value
 * Bytes256(new Uint8Array(256))      // Valid from bytes
 * Bytes256("0x1234")                 // Error: not 256 bytes
 * ```
 */
export function Bytes256(value: `0x${string}` | Uint8Array): Bytes256 {
	let hex: string;

	if (value instanceof Uint8Array) {
		if (value.length !== 256) {
			throw new Error(`Bytes256 must be exactly 256 bytes, got ${value.length}`);
		}
		hex = `0x${Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('')}`;
	} else {
		hex = value.toLowerCase();
	}

	if (!isValidBytes256Hex(hex)) {
		const hexPart = hex.slice(2);
		throw new Error(
			`Invalid Bytes256 format: ${hex}. Must be exactly 512 hex characters (256 bytes), got ${hexPart.length} characters`
		);
	}

	return hex as Bytes256;
}

/**
 * Type guard to check if a value is Hash32
 * @param value - Value to check
 * @returns true if value is valid Hash32
 */
export function isHash32(value: unknown): value is Hash32 {
	return typeof value === 'string' && isValidHash32Hex(value);
}

/**
 * Alias for isHash32
 */
export const isBytes32 = isHash32;

/**
 * Type guard to check if a value is Bytes256
 * @param value - Value to check
 * @returns true if value is valid Bytes256
 */
export function isBytes256(value: unknown): value is Bytes256 {
	return typeof value === 'string' && isValidBytes256Hex(value);
}

/**
 * Converts Hash32 to Uint8Array
 * @param hash - Hash32 to convert
 * @returns 32-byte Uint8Array
 */
export function hash32ToUint8Array(hash: Hash32): Uint8Array {
	const hex = hash.slice(2);
	const result = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		result[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return result;
}

/**
 * Alias for hash32ToUint8Array
 */
export const bytes32ToUint8Array = hash32ToUint8Array;

/**
 * Converts Bytes256 to Uint8Array
 * @param bytes - Bytes256 to convert
 * @returns 256-byte Uint8Array
 */
export function bytes256ToUint8Array(bytes: Bytes256): Uint8Array {
	const hex = bytes.slice(2);
	const result = new Uint8Array(256);
	for (let i = 0; i < 256; i++) {
		result[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return result;
}

/**
 * Converts Hash32 to bigint (interprets as big-endian unsigned integer)
 * @param hash - Hash32 to convert
 * @returns BigInt representation
 */
export function hash32ToBigInt(hash: Hash32): bigint {
	return BigInt(hash);
}

/**
 * Creates Hash32 from bigint (converts to big-endian 32-byte representation)
 * @param value - BigInt value (must fit in 256 bits)
 * @returns Hash32 representation
 * @throws Error if value is negative or too large
 */
export function bigIntToHash32(value: bigint): Hash32 {
	if (value < 0n) {
		throw new Error(`Hash32 value must be non-negative, got ${value}`);
	}

	const max = (1n << 256n) - 1n;
	if (value > max) {
		throw new Error(`Hash32 value must fit in 256 bits, got ${value}`);
	}

	// Convert to hex and pad to 64 characters
	const hex = value.toString(16).padStart(64, '0');
	return `0x${hex}` as Hash32;
}

/**
 * Common Hash32 constants
 */
export const HASH32_ZERO = Hash32(`0x${'00'.repeat(32)}` as `0x${string}`);
export const BYTES32_ZERO = HASH32_ZERO;

/**
 * Common Bytes256 constants
 */
export const BYTES256_ZERO = Bytes256(`0x${'00'.repeat(256)}` as `0x${string}`);

/**
 * Creates a Hash32 filled with a specific byte value
 * @param byte - Byte value to fill with (0-255)
 * @returns Hash32 filled with the byte
 */
export function fillHash32(byte: number): Hash32 {
	if (byte < 0 || byte > 255 || !Number.isInteger(byte)) {
		throw new Error(`Byte must be an integer in range 0-255, got ${byte}`);
	}
	const hex = byte.toString(16).padStart(2, '0');
	return Hash32(`0x${hex.repeat(32)}` as `0x${string}`);
}

/**
 * Creates a Bytes256 filled with a specific byte value
 * @param byte - Byte value to fill with (0-255)
 * @returns Bytes256 filled with the byte
 */
export function fillBytes256(byte: number): Bytes256 {
	if (byte < 0 || byte > 255 || !Number.isInteger(byte)) {
		throw new Error(`Byte must be an integer in range 0-255, got ${byte}`);
	}
	const hex = byte.toString(16).padStart(2, '0');
	return Bytes256(`0x${hex.repeat(256)}` as `0x${string}`);
}
