/**
 * Validate BIP-32 derivation path format.
 *
 * Checks syntax but not semantic validity.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} path - Derivation path to validate
 * @returns {boolean} True if path matches BIP-32 format (m/number'/number/...), false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as HDWallet from './crypto/HDWallet/index.js';
 * HDWallet.isValidPath("m/44'/60'/0'/0/0"); // true
 * HDWallet.isValidPath("invalid");          // false
 * ```
 */
export function isValidPath(path) {
	const pathRegex = /^m(\/\d+'?)+$/;
	return pathRegex.test(path);
}
