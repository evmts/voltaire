/**
 * Keccak-256 hashing using @noble/hashes
 *
 * This module provides Keccak-256 cryptographic hashing, the core hash function
 * used throughout Ethereum for address derivation, transaction hashing, and more.
 */

import { keccak_256 } from "@noble/hashes/sha3.js";

/**
 * Compute Keccak-256 hash of input data
 *
 * @param data - Input data to hash
 * @returns 32-byte Keccak-256 hash
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([1, 2, 3, 4]);
 * const hash = keccak256(data);
 * // Uint8Array(32) [...]
 * ```
 */
export function keccak256(data: Uint8Array): Uint8Array {
	return keccak_256(data);
}

/**
 * Compute Keccak-256 hash of hex string and return as hex string
 *
 * @param hex - Hex string to hash (with or without 0x prefix)
 * @returns Keccak-256 hash as 0x-prefixed hex string
 *
 * @example
 * ```typescript
 * const hash = keccak256Hex("0x1234");
 * // "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6"
 * ```
 */
export function keccak256Hex(hex: string): string {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);

	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
	}

	const hash = keccak256(bytes);
	return `0x${Array.from(hash)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}
