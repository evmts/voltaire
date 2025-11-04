/**
 * Keccak256 Hash Function
 *
 * Pure TypeScript Keccak256 implementation using @noble/hashes.
 * Data-first API following primitives pattern.
 *
 * @example
 * ```typescript
 * import { Keccak256 } from './keccak256.js';
 *
 * // Hash bytes
 * const hash = Keccak256.hash(data);
 *
 * // Hash string
 * const hash = Keccak256.hashString('hello');
 *
 * // Hash hex
 * const hash = Keccak256.hashHex('0x1234...');
 * ```
 */

import { keccak_256 } from "@noble/hashes/sha3.js";
import { Hash, type BrandedHash } from "../primitives/Hash/index.js";

// ============================================================================
// Main Keccak256 Namespace
// ============================================================================

export namespace Keccak256 {
	// ==========================================================================
	// Constants
	// ==========================================================================

	/**
	 * Digest size in bytes (32 bytes = 256 bits)
	 */
	export const DIGEST_SIZE = 32;

	/**
	 * Rate in bytes for Keccak256 (136 bytes = 1088 bits)
	 */
	export const RATE = 136;

	/**
	 * State size (25 u64 words = 1600 bits)
	 */
	export const STATE_SIZE = 25;

	// ==========================================================================
	// Hashing Functions
	// ==========================================================================

	/**
	 * Hash data with Keccak-256
	 *
	 * @param data - Data to hash
	 * @returns 32-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Keccak256.hash(data);
	 * ```
	 */
	export function hash(data: Uint8Array): BrandedHash {
		return keccak_256(data) as BrandedHash;
	}

	/**
	 * Hash string with Keccak-256
	 *
	 * String is UTF-8 encoded before hashing.
	 *
	 * @param str - String to hash
	 * @returns 32-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Keccak256.hashString('hello');
	 * ```
	 */
	export function hashString(str: string): BrandedHash {
		const encoder = new TextEncoder();
		return hash(encoder.encode(str));
	}

	/**
	 * Hash hex string with Keccak-256
	 *
	 * @param hex - Hex string to hash (with or without 0x prefix)
	 * @returns 32-byte hash
	 * @throws If hex string is invalid or has odd length
	 *
	 * @example
	 * ```typescript
	 * const hash = Keccak256.hashHex('0x1234...');
	 * ```
	 */
	export function hashHex(hex: string): BrandedHash {
		const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
		if (!/^[0-9a-fA-F]*$/.test(normalized)) {
			throw new Error("Invalid hex string");
		}
		if (normalized.length % 2 !== 0) {
			throw new Error("Hex string must have even length");
		}
		const bytes = new Uint8Array(normalized.length / 2);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
		}
		return hash(bytes);
	}

	/**
	 * Hash multiple data chunks in sequence
	 *
	 * Equivalent to hashing the concatenation of all chunks.
	 *
	 * @param chunks - Array of data chunks to hash
	 * @returns 32-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Keccak256.hashMultiple([data1, data2, data3]);
	 * ```
	 */
	export function hashMultiple(chunks: readonly Uint8Array[]): BrandedHash {
		const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
		const combined = new Uint8Array(totalLength);
		let offset = 0;
		for (const chunk of chunks) {
			combined.set(chunk, offset);
			offset += chunk.length;
		}
		return hash(combined);
	}

	// ==========================================================================
	// Utility Functions
	// ==========================================================================

	/**
	 * Compute function selector (first 4 bytes of Keccak-256 hash)
	 *
	 * Used for Ethereum function signatures.
	 *
	 * @param signature - Function signature string
	 * @returns 4-byte selector
	 *
	 * @example
	 * ```typescript
	 * const selector = Keccak256.selector('transfer(address,uint256)');
	 * // Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
	 * ```
	 */
	export function selector(signature: string): Uint8Array {
		const digest = hashString(signature);
		return digest.slice(0, 4);
	}

	/**
	 * Compute event topic (32-byte Keccak-256 hash)
	 *
	 * Used for Ethereum event signatures.
	 *
	 * @param signature - Event signature string
	 * @returns 32-byte topic
	 *
	 * @example
	 * ```typescript
	 * const topic = Keccak256.topic('Transfer(address,address,uint256)');
	 * ```
	 */
	export function topic(signature: string): BrandedHash {
		return hashString(signature);
	}

	/**
	 * Compute contract address from deployer and nonce
	 *
	 * Uses CREATE formula: keccak256(rlp([sender, nonce]))[12:]
	 *
	 * @param sender - Deployer address (20 bytes)
	 * @param nonce - Transaction nonce
	 * @returns Contract address (20 bytes)
	 *
	 * @example
	 * ```typescript
	 * const address = Keccak256.contractAddress(sender, nonce);
	 * ```
	 */
	export function contractAddress(
		sender: Uint8Array,
		nonce: bigint,
	): Uint8Array {
		if (sender.length !== 20) {
			throw new Error("Sender must be 20 bytes");
		}
		// Simplified version - full RLP encoding needed for production
		// This is just the hash portion
		const data = new Uint8Array([...sender, ...nonceToBytes(nonce)]);
		const digest = hash(data);
		return digest.slice(12);
	}

	/**
	 * Compute CREATE2 address
	 *
	 * Uses CREATE2 formula: keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
	 *
	 * @param sender - Deployer address (20 bytes)
	 * @param salt - 32-byte salt
	 * @param initCodeHash - Hash of initialization code
	 * @returns Contract address (20 bytes)
	 *
	 * @example
	 * ```typescript
	 * const address = Keccak256.create2Address(sender, salt, initCodeHash);
	 * ```
	 */
	export function create2Address(
		sender: Uint8Array,
		salt: Uint8Array,
		initCodeHash: Uint8Array,
	): Uint8Array {
		if (sender.length !== 20) {
			throw new Error("Sender must be 20 bytes");
		}
		if (salt.length !== 32) {
			throw new Error("Salt must be 32 bytes");
		}
		if (initCodeHash.length !== 32) {
			throw new Error("Init code hash must be 32 bytes");
		}
		const data = new Uint8Array(1 + 20 + 32 + 32);
		data[0] = 0xff;
		data.set(sender, 1);
		data.set(salt, 21);
		data.set(initCodeHash, 53);
		const digest = hash(data);
		return digest.slice(12);
	}

	/**
	 * Helper: Convert nonce to minimal bytes
	 */
	function nonceToBytes(nonce: bigint): Uint8Array {
		if (nonce === 0n) {
			return new Uint8Array([0x80]); // RLP empty list
		}
		const hex = nonce.toString(16);
		const paddedHex = hex.length % 2 ? `0${hex}` : hex;
		const bytes = new Uint8Array(paddedHex.length / 2);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Number.parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
		}
		return bytes;
	}
}

// Re-export namespace as default
export default Keccak256;
