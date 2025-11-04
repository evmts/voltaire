import { SIZE } from "./BrandedHash.js";

/**
 * Generate random hash
 *
 * @returns {import('./BrandedHash.js').BrandedHash} Random 32-byte hash
 * @throws {Error} If crypto.getRandomValues not available
 *
 * @example
 * ```js
 * const hash = Hash.random();
 * ```
 */
export function random() {
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		const bytes = new Uint8Array(SIZE);
		crypto.getRandomValues(bytes);
		return /** @type {import('./BrandedHash.ts').BrandedHash} */ (bytes);
	}
	throw new Error("crypto.getRandomValues not available");
}
