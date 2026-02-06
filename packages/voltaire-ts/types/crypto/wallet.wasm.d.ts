/**
 * Generate a random private key (32 bytes)
 * @returns {Uint8Array} Random private key
 */
export function generatePrivateKey(): Uint8Array;
/**
 * Compress an uncompressed public key (64 bytes) to compressed form (33 bytes)
 * @param {Uint8Array} uncompressed - Uncompressed public key (64 bytes)
 * @returns {Uint8Array} Compressed public key (33 bytes)
 */
export function compressPublicKey(uncompressed: Uint8Array): Uint8Array;
//# sourceMappingURL=wallet.wasm.d.ts.map