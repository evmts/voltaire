import type { BrandedHash } from "./BrandedHash.js";
import { keccak256 } from "./keccak256.js";

/**
 * Hash hex string with Keccak-256
 *
 * @param hex - Hex string to hash (with or without 0x prefix)
 * @returns 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Hash.keccak256Hex('0x1234...');
 * ```
 */
export function keccak256Hex(hex: string): BrandedHash {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (normalized.length % 2 !== 0) {
		throw new Error("Hex string must have even length");
	}
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return keccak256(bytes);
}
