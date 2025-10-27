/**
 * Hash value (32 bytes)
 * Used for Keccak-256, SHA-256, etc.
 *
 * Maps to C type: PrimitivesHash
 * struct PrimitivesHash { uint8_t bytes[32]; }
 */
export interface Hash {
	/** Raw 32-byte hash data */
	bytes: Uint8Array;
}

/**
 * Hash as hex string (66 characters: "0x" + 64 hex)
 */
export type HashHex = `0x${string}`;

/**
 * Hash size in bytes
 */
export const HASH_SIZE = 32;

/**
 * Hash hex string length (with 0x prefix)
 */
export const HASH_HEX_LENGTH = 66;

/**
 * Type guard: Check if string is valid hash hex (66 chars)
 */
export function isHashHex(value: unknown): value is HashHex {
	return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

/**
 * Type guard: Check if value is Hash
 */
export function isHash(value: unknown): value is Hash {
	return (
		typeof value === "object" &&
		value !== null &&
		"bytes" in value &&
		value.bytes instanceof Uint8Array &&
		value.bytes.length === 32
	);
}

/**
 * Create Hash from bytes
 *
 * @param bytes 32-byte Uint8Array
 * @returns Hash object
 * @throws Error if bytes length is not 32
 */
export function createHash(bytes: Uint8Array): Hash {
	if (bytes.length !== HASH_SIZE) {
		throw new Error(`Hash must be ${HASH_SIZE} bytes, got ${bytes.length}`);
	}
	return { bytes: new Uint8Array(bytes) };
}

/**
 * Zero hash (0x0000...0000, 32 bytes)
 */
export const ZERO_HASH: Hash = {
	bytes: new Uint8Array(32),
};

/**
 * Check if hash is zero hash
 *
 * @param hash Hash to check
 * @returns true if all bytes are zero
 */
export function isZeroHash(hash: Hash): boolean {
	return hash.bytes.every((byte) => byte === 0);
}

/**
 * Compare two hashes for equality
 *
 * @param a First hash
 * @param b Second hash
 * @returns true if hashes are equal
 */
export function hashEquals(a: Hash, b: Hash): boolean {
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
 * Convert Hash to hex string
 *
 * @param hash Hash object
 * @returns 66-character hex string
 */
export function hashToHex(hash: Hash): HashHex {
	return bytesToHex(hash.bytes) as HashHex;
}
