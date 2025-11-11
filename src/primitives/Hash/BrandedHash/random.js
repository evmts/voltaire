import { SIZE } from "./BrandedHash.js";

/**
 * Generate random hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @returns {import('./BrandedHash.js').BrandedHash} Random 32-byte hash
 * @throws {Error} If crypto.getRandomValues not available
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
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
