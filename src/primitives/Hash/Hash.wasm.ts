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
 * @throws {ValidationError} If input data is empty
 */
export function sha256(data: string | Uint8Array): Uint8Array {
	const input =
		typeof data === "string"
			? new TextEncoder().encode(data)
			: new Uint8Array(data);

	if (input.length === 0) {
		throw new ValidationError("Input data cannot be empty", {
			code: "HASH_EMPTY_INPUT",
			value: data,
			expected: "non-empty data",
			docsPath: "/primitives/hash",
		});
	}

	return loader.sha256(input);
}

/**
 * Compute RIPEMD-160 hash
 * @param data - Input data (string, Uint8Array, or Buffer)
 * @returns 20-byte RIPEMD-160 hash
 * @throws {ValidationError} If input data is empty
 */
export function ripemd160(data: string | Uint8Array): Uint8Array {
	const input =
		typeof data === "string"
			? new TextEncoder().encode(data)
			: new Uint8Array(data);

	if (input.length === 0) {
		throw new ValidationError("Input data cannot be empty", {
			code: "HASH_EMPTY_INPUT",
			value: data,
			expected: "non-empty data",
			docsPath: "/primitives/hash",
		});
	}

	return loader.ripemd160(input);
}

/**
 * Compute BLAKE2b hash
 * @param data - Input data (string, Uint8Array, or Buffer)
 * @returns 64-byte BLAKE2b hash
 * @throws {ValidationError} If input data is empty
 */
export function blake2b(data: string | Uint8Array): Uint8Array {
	const input =
		typeof data === "string"
			? new TextEncoder().encode(data)
			: new Uint8Array(data);

	if (input.length === 0) {
		throw new ValidationError("Input data cannot be empty", {
			code: "HASH_EMPTY_INPUT",
			value: data,
			expected: "non-empty data",
			docsPath: "/primitives/hash",
		});
	}

	return loader.blake2b(input);
}

/**
 * Compute Solidity-style Keccak-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte Keccak-256 hash
 * @throws {ValidationError} If packed data is empty
 */
export function solidityKeccak256(packedData: Uint8Array): Uint8Array {
	const input = new Uint8Array(packedData);

	if (input.length === 0) {
		throw new ValidationError("Packed data cannot be empty", {
			code: "HASH_EMPTY_INPUT",
			value: packedData,
			expected: "non-empty data",
			docsPath: "/primitives/hash",
		});
	}

	return loader.solidityKeccak256(input);
}

/**
 * Compute Solidity-style SHA-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte SHA-256 hash
 * @throws {ValidationError} If packed data is empty
 */
export function soliditySha256(packedData: Uint8Array): Uint8Array {
	const input = new Uint8Array(packedData);

	if (input.length === 0) {
		throw new ValidationError("Packed data cannot be empty", {
			code: "HASH_EMPTY_INPUT",
			value: packedData,
			expected: "non-empty data",
			docsPath: "/primitives/hash",
		});
	}

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
