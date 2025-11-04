/**
 * Validate BIP-32 path format
 *
 * @param {string} path - Path to validate
 * @returns {boolean} True if valid BIP-32 path
 *
 * @example
 * ```typescript
 * HDWallet.isValidPath("m/44'/60'/0'/0/0"); // true
 * HDWallet.isValidPath("invalid");          // false
 * ```
 */
export function isValidPath(path) {
	const pathRegex = /^m(\/\d+'?)+$/;
	return pathRegex.test(path);
}
