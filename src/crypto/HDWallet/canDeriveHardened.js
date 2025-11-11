/**
 * Check if extended key can derive hardened children.
 *
 * Only keys with private key material can derive hardened paths.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Extended key to check
 * @returns {boolean} True if key has private key and can derive hardened children, false if public-only
 * @throws {never}
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * if (HDWallet.canDeriveHardened(key)) {
 *   const hardened = HDWallet.deriveChild(key, HDWallet.HARDENED_OFFSET);
 * }
 * ```
 */
export function canDeriveHardened(key) {
	return key.privateKey !== null;
}
