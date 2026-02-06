/**
 * WASM implementation of SHA256 hash function
 * Uses WebAssembly bindings to Zig implementation
 */

import * as loader from "../wasm-loader/loader.js";

/**
 * SHA256 hash function implemented using WASM Zig code
 */
export namespace Sha256Wasm {
	/**
	 * SHA256 output size in bytes (256 bits / 8)
	 */
	export const OUTPUT_SIZE = 32;

	/**
	 * SHA256 block size in bytes
	 */
	export const BLOCK_SIZE = 64;

	/**
	 * Compute SHA256 hash of input data
	 *
	 * @param data - Input data as Uint8Array
	 * @returns 32-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Sha256Wasm.hash(new Uint8Array([1, 2, 3]));
	 * // Uint8Array(32) [...]
	 * ```
	 */
	export function hash(data: Uint8Array): Uint8Array {
		return loader.sha256(data);
	}

	/**
	 * Compute SHA256 hash of UTF-8 string
	 *
	 * @param str - Input string
	 * @returns 32-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Sha256Wasm.hashString("hello world");
	 * // Uint8Array(32) [0xb9, 0x4d, 0x27, ...]
	 * ```
	 */
	export function hashString(str: string): Uint8Array {
		const encoder = new TextEncoder();
		const data = encoder.encode(str);
		return loader.sha256(data);
	}

	/**
	 * Compute SHA256 hash of hex string (without 0x prefix)
	 *
	 * @param hex - Hex string (with or without 0x prefix)
	 * @returns 32-byte hash
	 *
	 * @example
	 * ```typescript
	 * const hash = Sha256Wasm.hashHex("0xdeadbeef");
	 * // Uint8Array(32) [...]
	 * ```
	 */
	export function hashHex(hex: string): Uint8Array {
		const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
		const bytes = new Uint8Array(normalized.length / 2);
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
		}
		return loader.sha256(bytes);
	}

	/**
	 * Convert hash output to hex string
	 *
	 * @param hash - Hash bytes
	 * @returns Hex string with 0x prefix
	 *
	 * @example
	 * ```typescript
	 * const hash = Sha256Wasm.hash(data);
	 * const hexStr = Sha256Wasm.toHex(hash);
	 * // "0x..."
	 * ```
	 */
	export function toHex(hash: Uint8Array): string {
		return `0x${Array.from(hash)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`;
	}

	/**
	 * Incremental hasher for streaming data
	 *
	 * Note: This implementation uses a simple buffer accumulator.
	 * For truly large streaming data, consider using the Noble.js implementation.
	 *
	 * @example
	 * ```typescript
	 * const hasher = Sha256Wasm.create();
	 * hasher.update(chunk1);
	 * hasher.update(chunk2);
	 * const hash = hasher.digest();
	 * ```
	 */
	export function create() {
		const chunks: Uint8Array[] = [];
		let totalLength = 0;

		return {
			/**
			 * Update hasher with new data
			 */
			update(data: Uint8Array): void {
				chunks.push(data);
				totalLength += data.length;
			},
			/**
			 * Finalize and get hash
			 */
			digest(): Uint8Array {
				// Concatenate all chunks
				const combined = new Uint8Array(totalLength);
				let offset = 0;
				for (const chunk of chunks) {
					combined.set(chunk, offset);
					offset += chunk.length;
				}
				return loader.sha256(combined);
			},
		};
	}
}

// Re-export as default
export default Sha256Wasm;
