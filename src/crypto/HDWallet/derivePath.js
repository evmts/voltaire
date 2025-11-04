import { InvalidPathError } from "./errors.js";

/**
 * Derive child key from parent using BIP-32 path
 *
 * @param {import('./BrandedExtendedKey.js').BrandedExtendedKey} key - Parent extended key
 * @param {string} path - Derivation path (e.g., "m/44'/60'/0'/0/0")
 * @returns {import('./BrandedExtendedKey.js').BrandedExtendedKey} Derived extended key
 * @throws {InvalidPathError} If derivation path is invalid
 *
 * @example
 * ```typescript
 * const root = HDWallet.fromSeed(seed);
 * const child = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
 * ```
 */
export function derivePath(key, path) {
	try {
		return /** @type {import('./BrandedExtendedKey.js').BrandedExtendedKey} */ (
			key.derive(path)
		);
	} catch (error) {
		throw new InvalidPathError(`Invalid derivation path "${path}": ${error}`);
	}
}
