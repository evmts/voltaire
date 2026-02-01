/**
 * WASM Keccak/Hash wrapper for src/wasm/index.ts
 * Re-exports from keccak256.wasm.ts and provides Hash class
 */

import { Hash } from "../primitives/Hash/index.js";
import * as Keccak256Wasm from "./keccak256.wasm.js";

// Re-export Hash type
export { Hash };

// Re-export keccak256 function
/**
 * @param {string | Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export async function keccak256(data) {
	await Keccak256Wasm.init();
	const bytes =
		typeof data === "string" ? new TextEncoder().encode(data) : data;
	return Keccak256Wasm.hash(bytes);
}

// Re-export eip191HashMessage if needed
/**
 * @param {string | Uint8Array} message
 * @returns {Promise<Uint8Array>}
 */
export async function eip191HashMessage(message) {
	await Keccak256Wasm.init();
	// EIP-191 format: "\x19Ethereum Signed Message:\n" + len(message) + message
	const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
	const prefixBytes = new TextEncoder().encode(prefix);
	const messageBytes =
		typeof message === "string" ? new TextEncoder().encode(message) : message;

	const combined = new Uint8Array(prefixBytes.length + messageBytes.length);
	combined.set(prefixBytes, 0);
	combined.set(messageBytes, prefixBytes.length);

	return Keccak256Wasm.hash(combined);
}
