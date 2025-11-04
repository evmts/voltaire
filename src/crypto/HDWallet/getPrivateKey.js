/**
 * Get private key bytes
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {Uint8Array | null} 32-byte private key or null if public-only key
 *
 * @example
 * ```typescript
 * const privKey = HDWallet.getPrivateKey(key);
 * ```
 */
export function getPrivateKey(key) {
	return key.privateKey;
}
