/**
 * Check if path uses hardened derivation
 *
 * @param {string} path - BIP-32 path
 * @returns {boolean} True if path contains hardened derivation (')
 *
 * @example
 * ```typescript
 * HDWallet.isHardenedPath("m/44'/60'/0'"); // true
 * HDWallet.isHardenedPath("m/44/60/0");    // false
 * ```
 */
export function isHardenedPath(path) {
	return path.includes("'") || path.includes("h");
}
