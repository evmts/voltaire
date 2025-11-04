/**
 * Minimal Noble Keccak256 implementation for bundle size testing
 */

import { keccak_256 } from "@noble/hashes/sha3.js";

export function hash(data: Uint8Array): Uint8Array {
	return keccak_256(data);
}

export function hashString(str: string): Uint8Array {
	const bytes = new TextEncoder().encode(str);
	return keccak_256(bytes);
}

export function hashHex(hex: string): Uint8Array {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
	}
	return keccak_256(bytes);
}
