/**
 * WASM Keccak256 Hash Function
 *
 * WASM-accelerated Keccak256 implementation using unified wasm-loader.
 * Data-first API matching the Noble implementation.
 *
 * @example
 * ```typescript
 * import { Keccak256Wasm } from './keccak256.wasm.js';
 *
 * // Hash bytes
 * const hash = Keccak256Wasm.hash(data);
 *
 * // Hash string
 * const hash = Keccak256Wasm.hashString('hello');
 *
 * // Hash hex
 * const hash = Keccak256Wasm.hashHex('0x1234...');
 * ```
 */

import type { BrandedHash } from "../primitives/Hash/index.js";
import * as loader from "../wasm-loader/loader.js";

let isInitialized = false;

/**
 * Initialize WASM module
 */
async function ensureInit(): Promise<void> {
	if (isInitialized) return;
	await loader.loadWasm(
		new URL("../wasm-loader/primitives.wasm", import.meta.url),
	);
	isInitialized = true;
}

// ============================================================================
// Core Hash Functions
// ============================================================================

/**
 * Hash bytes using Keccak256
 * @param data - Input bytes to hash
 * @returns 32-byte Keccak256 hash
 */
export function hash(data: Uint8Array): BrandedHash {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	return loader.keccak256(data) as BrandedHash;
}

/**
 * Hash a UTF-8 string
 * @param str - String to hash
 * @returns 32-byte Keccak256 hash
 */
export function hashString(str: string): BrandedHash {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	const bytes = new TextEncoder().encode(str);
	return loader.keccak256(bytes) as BrandedHash;
}

/**
 * Hash a hex string
 * @param hex - Hex string to hash (with or without 0x prefix)
 * @returns 32-byte Keccak256 hash
 */
export function hashHex(hex: string): BrandedHash {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
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
	return loader.keccak256(bytes) as BrandedHash;
}

/**
 * Hash multiple byte arrays in sequence
 * @param chunks - Array of byte arrays to hash
 * @returns 32-byte Keccak256 hash
 */
export function hashMultiple(chunks: Uint8Array[]): BrandedHash {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	// Concatenate all chunks
	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
	const combined = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		combined.set(chunk, offset);
		offset += chunk.length;
	}
	return loader.keccak256(combined) as BrandedHash;
}

// ============================================================================
// Ethereum Utilities
// ============================================================================

/**
 * Compute function selector (first 4 bytes of hash)
 * @param signature - Function signature string (e.g., "transfer(address,uint256)")
 * @returns 4-byte function selector
 */
export function selector(signature: string): Uint8Array {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	const bytes = new TextEncoder().encode(signature);
	const hash = loader.keccak256(bytes);
	return hash.slice(0, 4);
}

/**
 * Compute event topic (full 32-byte hash)
 * @param signature - Event signature string (e.g., "Transfer(address,address,uint256)")
 * @returns 32-byte event topic as BrandedHash
 */
export function topic(
	signature: string,
): import("../primitives/Hash/BrandedHash/BrandedHash.js").BrandedHash {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	const bytes = new TextEncoder().encode(signature);
	const hash = loader.keccak256(bytes);
	return hash as BrandedHash;
}

/**
 * Compute CREATE contract address
 * @param sender - Sender address (20 bytes)
 * @param nonce - Transaction nonce
 * @returns Contract address (20 bytes)
 */
export function contractAddress(sender: Uint8Array, nonce: bigint): Uint8Array {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	if (sender.length !== 20) {
		throw new Error("Sender must be 20 bytes");
	}
	// Convert nonce to minimal bytes
	let nonceBytes: Uint8Array;
	if (nonce === 0n) {
		nonceBytes = new Uint8Array([0x80]); // RLP empty list
	} else {
		const hex = nonce.toString(16);
		const paddedHex = hex.length % 2 ? `0${hex}` : hex;
		nonceBytes = new Uint8Array(paddedHex.length / 2);
		for (let i = 0; i < nonceBytes.length; i++) {
			nonceBytes[i] = Number.parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
		}
	}

	// Concatenate sender and nonce bytes
	const combined = new Uint8Array(sender.length + nonceBytes.length);
	combined.set(sender, 0);
	combined.set(nonceBytes, sender.length);

	const hash = loader.keccak256(combined);
	return hash.slice(12); // Take last 20 bytes
}

/**
 * Compute CREATE2 contract address
 * @param sender - Sender address (20 bytes)
 * @param salt - Salt (32 bytes)
 * @param initCodeHash - Init code hash (32 bytes)
 * @returns Contract address (20 bytes)
 */
export function create2Address(
	sender: Uint8Array,
	salt: Uint8Array,
	initCodeHash: Uint8Array,
): Uint8Array {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	if (sender.length !== 20) {
		throw new Error("Sender must be 20 bytes");
	}
	if (salt.length !== 32) {
		throw new Error("Salt must be 32 bytes");
	}
	if (initCodeHash.length !== 32) {
		throw new Error("Init code hash must be 32 bytes");
	}
	// 0xff ++ sender ++ salt ++ initCodeHash
	const combined = new Uint8Array(
		1 + sender.length + salt.length + initCodeHash.length,
	);
	combined[0] = 0xff;
	combined.set(sender, 1);
	combined.set(salt, 1 + sender.length);
	combined.set(initCodeHash, 1 + sender.length + salt.length);

	const hash = loader.keccak256(combined);
	return hash.slice(-20); // Take last 20 bytes
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize WASM module (must be called before using any functions)
 */
export async function init(): Promise<void> {
	await ensureInit();
}

/**
 * Check if WASM is initialized
 */
export function isReady(): boolean {
	return isInitialized;
}

// ============================================================================
// Re-export for namespace access
// ============================================================================

export const Keccak256Wasm = {
	hash,
	hashString,
	hashHex,
	hashMultiple,
	selector,
	topic,
	contractAddress,
	create2Address,
	init,
	isReady,
	DIGEST_SIZE: 32,
	RATE: 136,
	STATE_SIZE: 25,
};
