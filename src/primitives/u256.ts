/**
 * 256-bit unsigned integer (32 bytes, big-endian)
 *
 * Maps to C type: PrimitivesU256
 * struct PrimitivesU256 { uint8_t bytes[32]; }
 */
export interface U256 {
	/** Raw 32-byte big-endian integer data */
	bytes: Uint8Array;
}

/**
 * U256 as hex string (up to 66 characters: "0x" + up to 64 hex)
 */
export type U256Hex = `0x${string}`;

/**
 * U256 size in bytes
 */
export const U256_SIZE = 32;

/**
 * U256 hex string max length (with 0x prefix)
 */
export const U256_HEX_MAX_LENGTH = 66;

/**
 * Type guard: Check if value is U256
 */
export function isU256(value: unknown): value is U256 {
	return (
		typeof value === "object" &&
		value !== null &&
		"bytes" in value &&
		value.bytes instanceof Uint8Array &&
		value.bytes.length === 32
	);
}

/**
 * Create U256 from bytes
 *
 * @param bytes 32-byte big-endian Uint8Array
 * @returns U256 object
 * @throws Error if bytes length is not 32
 */
export function createU256(bytes: Uint8Array): U256 {
	if (bytes.length !== U256_SIZE) {
		throw new Error(`U256 must be ${U256_SIZE} bytes, got ${bytes.length}`);
	}
	return { bytes: new Uint8Array(bytes) };
}

/**
 * Zero U256 (0x0000...0000, 32 bytes)
 */
export const ZERO_U256: U256 = {
	bytes: new Uint8Array(32),
};

/**
 * Compare two U256 values for equality
 *
 * @param a First U256
 * @param b Second U256
 * @returns true if values are equal
 */
export function u256Equals(a: U256, b: U256): boolean {
	if (a.bytes.length !== b.bytes.length) {
		return false;
	}
	for (let i = 0; i < a.bytes.length; i++) {
		if (a.bytes[i] !== b.bytes[i]) {
			return false;
		}
	}
	return true;
}

/**
 * Convert bytes to hex string with 0x prefix
 *
 * @param bytes Input bytes
 * @returns Hex string with 0x prefix
 */
function bytesToHex(bytes: Uint8Array): string {
	return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Convert U256 to hex string
 *
 * @param value U256 object
 * @returns Hex string (up to 66 characters)
 */
export function u256ToHex(value: U256): U256Hex {
	return bytesToHex(value.bytes) as U256Hex;
}
