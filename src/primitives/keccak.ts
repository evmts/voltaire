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
