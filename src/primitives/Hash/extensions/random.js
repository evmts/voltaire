import { SIZE } from "./constants.js";

/**
 * Generate random hash
 *
 * @returns {import('./BrandedHash.ts').BrandedHash} Random 32-byte hash
 *
 * @example
 * ```js
 * const randomHash = Hash.random();
 * ```
 */
export function random() {
	const bytes = new Uint8Array(SIZE);
	crypto.getRandomValues(bytes);
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (bytes);
}
