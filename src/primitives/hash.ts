/**
 * Hash utilities for Ethereum (Keccak-256)
 */

import { keccak256 as keccak } from "./keccak.ts";
import { hexToBytes, bytesToHex } from "./hex.ts";

/**
 * Hash (32 bytes) - typically used for Keccak-256 results
 */
export class Hash {
	readonly bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		if (bytes.length !== 32) {
			throw new Error("Hash must be exactly 32 bytes");
		}
		this.bytes = bytes;
	}

	static fromBytes(bytes: Uint8Array): Hash {
		return new Hash(bytes);
	}

	static fromHex(hex: string): Hash {
		const bytes = hexToBytes(hex);
		return new Hash(bytes);
	}

	toHex(): string {
		return bytesToHex(this.bytes);
	}

	isZero(): boolean {
		return this.bytes.every((b) => b === 0);
	}

	equals(other: Hash): boolean {
		for (let i = 0; i < 32; i++) {
			if (this.bytes[i] !== other.bytes[i]) return false;
		}
		return true;
	}
}

/**
 * Compute Keccak-256 hash of data
 */
export function keccak256(data: Uint8Array): Hash {
	return new Hash(keccak(data));
}

/**
 * Compute function selector (first 4 bytes of Keccak-256 of function signature)
 * @param signature - Function signature like "transfer(address,uint256)"
 */
export function selectorFromSignature(signature: string): Uint8Array {
	const hash = keccak(new TextEncoder().encode(signature));
	return hash.slice(0, 4);
}

export const ZERO_HASH = new Hash(new Uint8Array(32));
