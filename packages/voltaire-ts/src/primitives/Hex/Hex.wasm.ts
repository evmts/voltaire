/**
 * WASM implementation of hex utilities
 * Uses WebAssembly bindings to Zig implementation
 */

import * as loader from "../../wasm-loader/loader.js";
import {
	InvalidCharacterError,
	InvalidFormatError,
	OddLengthError,
} from "./errors.js";

/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Raw bytes
 * @throws {InvalidFormatError} If hex string is missing 0x prefix
 * @throws {InvalidCharacterError} If hex string contains invalid characters
 * @throws {OddLengthError} If hex string has odd length
 */
export function hexToBytes(hex: string): Uint8Array {
	try {
		return loader.hexToBytes(hex);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		// Map generic errors to typed errors based on message content
		if (message.includes("prefix") || message.includes("0x")) {
			throw new InvalidFormatError(message, {
				value: hex,
				cause: e instanceof Error ? e : undefined,
			});
		}
		if (message.includes("odd") || message.includes("length")) {
			throw new OddLengthError(message, {
				value: hex,
				cause: e instanceof Error ? e : undefined,
			});
		}
		if (message.includes("character") || message.includes("invalid")) {
			throw new InvalidCharacterError(message, {
				value: hex,
				cause: e instanceof Error ? e : undefined,
			});
		}
		// Re-throw unknown errors
		throw e;
	}
}

/**
 * Convert bytes to hex string
 * @param data - Raw bytes
 * @returns Hex string with 0x prefix
 */
export function bytesToHex(data: Uint8Array): string {
	const input = new Uint8Array(data);
	return loader.bytesToHex(input);
}

// Re-export for convenience
export default {
	hexToBytes,
	bytesToHex,
};
