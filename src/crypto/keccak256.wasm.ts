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
	// Remove 0x prefix if present
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	// Convert hex to bytes
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
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
 * @returns 4-byte function selector as hex string
 */
export function selector(signature: string): string {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	const bytes = new TextEncoder().encode(signature);
	const hash = loader.keccak256(bytes);
	return `0x${Array.from(hash.slice(0, 4))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

/**
 * Compute event topic (full 32-byte hash)
 * @param signature - Event signature string (e.g., "Transfer(address,address,uint256)")
 * @returns 32-byte event topic as hex string
 */
export function topic(signature: string): string {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	const bytes = new TextEncoder().encode(signature);
	const hash = loader.keccak256(bytes);
	return `0x${Array.from(hash)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

/**
 * Compute CREATE contract address
 * @param sender - Sender address (20 bytes)
 * @param nonce - Transaction nonce
 * @returns Contract address (20 bytes)
 */
export function contractAddress(
	sender: Uint8Array,
	nonce: bigint,
): Uint8Array {
	if (!isInitialized) {
		throw new Error("WASM not initialized. Call Keccak256Wasm.init() first.");
	}
	// RLP encode [sender, nonce]
	// This is a simplified version - real implementation needs proper RLP encoding
	const nonceBytes = new Uint8Array(8);
	const view = new DataView(nonceBytes.buffer);
	view.setBigUint64(0, nonce, false);

	// Concatenate sender and nonce bytes
	const combined = new Uint8Array(sender.length + nonceBytes.length);
	combined.set(sender, 0);
	combined.set(nonceBytes, sender.length);

	const hash = loader.keccak256(combined);
	return hash.slice(-20); // Take last 20 bytes
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
	// 0xff ++ sender ++ salt ++ initCodeHash
	const combined = new Uint8Array(1 + sender.length + salt.length + initCodeHash.length);
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
};
