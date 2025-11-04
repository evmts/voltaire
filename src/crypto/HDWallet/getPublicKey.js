/**
 * Get public key bytes
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {Uint8Array | null} 33-byte compressed public key or null
 *
 * @example
 * ```typescript
 * const pubKey = HDWallet.getPublicKey(key);
 * ```
 */
export function getPublicKey(key) {
	return key.publicKey;
}
