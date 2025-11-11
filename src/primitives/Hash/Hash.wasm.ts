/**
 * WASM implementation of hash algorithms
 * Uses WebAssembly bindings to Zig implementation
 */

import * as loader from "../../wasm-loader/loader.js";
import { ValidationError } from "../errors/ValidationError.js";

/**
 * Compute SHA-256 hash
 * @param data - Input data (string, Uint8Array, or Buffer)
 * @returns 32-byte SHA-256 hash
 */
export function sha256(data: string | Uint8Array): Uint8Array {
	const input =
		typeof data === "string"
			? new TextEncoder().encode(data)
			: new Uint8Array(data);

	return loader.sha256(input);
}

/**
 * Compute RIPEMD-160 hash
 * @param data - Input data (string, Uint8Array, or Buffer)
 * @returns 20-byte RIPEMD-160 hash
 */
export function ripemd160(data: string | Uint8Array): Uint8Array {
	const input =
		typeof data === "string"
			? new TextEncoder().encode(data)
			: new Uint8Array(data);

	return loader.ripemd160(input);
}

/**
 * Compute BLAKE2b hash
 * @param data - Input data (string, Uint8Array, or Buffer)
 * @returns 64-byte BLAKE2b hash
 */
export function blake2b(data: string | Uint8Array): Uint8Array {
	const input =
		typeof data === "string"
			? new TextEncoder().encode(data)
			: new Uint8Array(data);

	return loader.blake2b(input);
}

/**
 * Compute Solidity-style Keccak-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte Keccak-256 hash
 */
export function solidityKeccak256(packedData: Uint8Array): Uint8Array {
	const input = new Uint8Array(packedData);

	return loader.solidityKeccak256(input);
}

/**
 * Compute Solidity-style SHA-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte SHA-256 hash
 */
export function soliditySha256(packedData: Uint8Array): Uint8Array {
	const input = new Uint8Array(packedData);

	return loader.soliditySha256(input);
}

// Re-export for convenience
export default {
	sha256,
	ripemd160,
	blake2b,
	solidityKeccak256,
	soliditySha256,
};
