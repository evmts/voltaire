/**
 * Check if key can derive hardened children
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key
 * @returns {boolean} True if key has private key, false if public-only
 *
 * @example
 * ```typescript
 * if (HDWallet.canDeriveHardened(key)) {
 *   const hardened = key.deriveChild(HDWallet.HARDENED_OFFSET);
 * }
 * ```
 */
export function canDeriveHardened(key) {
	return key.privateKey !== null;
}
