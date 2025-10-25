/**
 * Keccak-256 hashing for Ethereum
 *
 * Note: Ethereum uses Keccak-256, not SHA3-256. They are different!
 */

import { keccak_256 } from "@noble/hashes/sha3.js";

export function keccak256(data: Uint8Array): Uint8Array {
	// Use @noble/hashes which implements the correct Keccak-256
	// (pre-NIST finalization) that Ethereum uses
	return keccak_256(data);
}

/**
 * Keccak-256 hash that returns hex string
 *
 * @param data - Data to hash (hex string or bytes)
 * @returns Hex string with 0x prefix
 */
export function keccak256Hex(data: string | Uint8Array): string {
	let bytes: Uint8Array;

	if (typeof data === "string") {
		// Convert hex string to bytes
		const cleanHex = data.startsWith("0x") ? data.slice(2) : data;
		bytes = new Uint8Array(cleanHex.length / 2);
		for (let i = 0; i < cleanHex.length; i += 2) {
			bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
		}
	} else {
		bytes = data;
	}

	const hash = keccak256(bytes);

	// Convert to hex string
	return (
		"0x" +
		Array.from(hash)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}
