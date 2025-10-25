/**
 * Nibble (4-bit value) utilities for trie path traversal
 *
 * Ethereum's MPT uses nibbles for efficient path compression.
 * Each byte is split into two nibbles: high (bits 4-7) and low (bits 0-3).
 */

import type { Bytes, Nibbles } from "./types.js";

/**
 * Convert bytes to nibbles
 *
 * @param bytes - Input bytes
 * @returns Array of nibbles (4-bit values)
 */
export function bytesToNibbles(bytes: Bytes): Nibbles {
	const nibbles: Nibbles = [];
	for (const byte of bytes) {
		nibbles.push(byte >> 4); // High nibble
		nibbles.push(byte & 0x0f); // Low nibble
	}
	return nibbles;
}

/**
 * Convert nibbles to bytes
 *
 * @param nibbles - Array of nibbles
 * @returns Bytes (requires even number of nibbles)
 * @throws Error if odd number of nibbles
 */
export function nibblesToBytes(nibbles: Nibbles): Bytes {
	if (nibbles.length % 2 !== 0) {
		throw new Error("Cannot convert odd number of nibbles to bytes");
	}

	const bytes = new Uint8Array(nibbles.length / 2);
	for (let i = 0; i < nibbles.length; i += 2) {
		bytes[i / 2] = (nibbles[i]! << 4) | nibbles[i + 1]!;
	}
	return bytes;
}

/**
 * Encode nibbles with hex prefix encoding
 *
 * Hex prefix encoding (Yellow Paper Appendix C):
 * - Even length, extension: [0x00, ...]
 * - Odd length, extension:  [0x1X, ...] where X is first nibble
 * - Even length, leaf:      [0x20, ...]
 * - Odd length, leaf:       [0x3X, ...] where X is first nibble
 *
 * @param nibbles - Nibbles to encode
 * @param isLeaf - Whether this is a leaf node
 * @returns Encoded bytes
 */
export function encodeNibbles(nibbles: Nibbles, isLeaf: boolean): Bytes {
	const isOdd = nibbles.length % 2 === 1;
	const prefix = (isLeaf ? 0x20 : 0x00) | (isOdd ? 0x10 : 0x00);

	if (isOdd) {
		// Odd length: prefix contains first nibble
		const encodedLen = Math.ceil((nibbles.length + 1) / 2);
		const encoded = new Uint8Array(encodedLen);
		encoded[0] = prefix | nibbles[0]!;

		// Pack remaining nibbles
		for (let i = 1; i < nibbles.length; i += 2) {
			const byteIndex = Math.floor((i + 1) / 2);
			encoded[byteIndex] = (nibbles[i]! << 4) | (nibbles[i + 1] || 0);
		}
		return encoded;
	}

	// Even length
	const encoded = new Uint8Array(nibbles.length / 2 + 1);
	encoded[0] = prefix;
	for (let i = 0; i < nibbles.length; i += 2) {
		encoded[i / 2 + 1] = (nibbles[i]! << 4) | nibbles[i + 1]!;
	}
	return encoded;
}

/**
 * Decode nibbles from hex prefix encoding
 *
 * @param encoded - Encoded bytes
 * @returns Decoded nibbles and leaf flag
 */
export function decodeNibbles(encoded: Bytes): { nibbles: Nibbles; isLeaf: boolean } {
	if (encoded.length === 0) {
		throw new Error("Cannot decode empty bytes");
	}

	const prefix = encoded[0]!;
	const isLeaf = (prefix & 0x20) !== 0;
	const isOdd = (prefix & 0x10) !== 0;

	const nibbles: Nibbles = [];

	if (isOdd) {
		// Odd length: first nibble is in prefix
		nibbles.push(prefix & 0x0f);
		for (let i = 1; i < encoded.length; i++) {
			nibbles.push(encoded[i]! >> 4);
			nibbles.push(encoded[i]! & 0x0f);
		}
	} else {
		// Even length
		for (let i = 1; i < encoded.length; i++) {
			nibbles.push(encoded[i]! >> 4);
			nibbles.push(encoded[i]! & 0x0f);
		}
	}

	return { nibbles, isLeaf };
}

/**
 * Find common prefix length between two nibble arrays
 *
 * @param a - First nibble array
 * @param b - Second nibble array
 * @returns Length of common prefix
 */
export function commonPrefixLength(a: Nibbles, b: Nibbles): number {
	const minLen = Math.min(a.length, b.length);
	for (let i = 0; i < minLen; i++) {
		if (a[i] !== b[i]) return i;
	}
	return minLen;
}

/**
 * Convert nibbles to string for debugging
 *
 * @param nibbles - Nibbles to convert
 * @returns Hex string representation
 */
export function nibblesToString(nibbles: Nibbles): string {
	return nibbles.map((n) => n.toString(16)).join("");
}
