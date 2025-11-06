/**
 * WASM Keccak/Hash wrapper for src/wasm/index.ts
 * Re-exports from keccak256.wasm.ts and provides Hash class
 */

import { BrandedHash } from "../primitives/Hash/index.js";
import * as Keccak256Wasm from "./keccak256.wasm.js";

// Re-export Hash type
export { BrandedHash as Hash };

// Re-export keccak256 function
export async function keccak256(data) {
	await Keccak256Wasm.init();
	return Keccak256Wasm.hash(data);
}

// Re-export eip191HashMessage if needed
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
