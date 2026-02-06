/**
 * WASM Wallet operations wrapper for src/wasm/index.ts
 * Re-exports wallet key generation functions from loader
 */

import * as loader from "../wasm-loader/loader.js";

/**
 * Generate a random private key (32 bytes)
 * @returns {Uint8Array} Random private key
 */
export function generatePrivateKey() {
	return loader.generatePrivateKey();
}

/**
 * Compress an uncompressed public key (64 bytes) to compressed form (33 bytes)
 * @param {Uint8Array} uncompressed - Uncompressed public key (64 bytes)
 * @returns {Uint8Array} Compressed public key (33 bytes)
 */
export function compressPublicKey(uncompressed) {
	return loader.compressPublicKey(uncompressed);
}
