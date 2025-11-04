/**
 * Get chain code
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {Uint8Array | null} 32-byte chain code
 *
 * @example
 * ```typescript
 * const chainCode = HDWallet.getChainCode(key);
 * ```
 */
export function getChainCode(key) {
	return key.chainCode;
}
