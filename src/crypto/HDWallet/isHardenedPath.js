/**
 * Check if BIP-32 path contains hardened derivation.
 *
 * Hardened paths use ' or h suffix (e.g., 44' or 44h).
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} path - BIP-32 derivation path
 * @returns {boolean} True if path contains hardened derivation indicator (' or h), false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * HDWallet.isHardenedPath("m/44'/60'/0'"); // true
 * HDWallet.isHardenedPath("m/44/60/0");    // false
 * ```
 */
export function isHardenedPath(path) {
	return path.includes("'") || path.includes("h");
}
