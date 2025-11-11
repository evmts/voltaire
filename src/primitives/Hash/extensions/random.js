import { SIZE } from "./constants.js";

/**
 * Generate random hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @returns {import('./BrandedHash.ts').BrandedHash} Random 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const randomHash = Hash.random();
 * ```
 */
export function random() {
	const bytes = new Uint8Array(SIZE);
	crypto.getRandomValues(bytes);
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (bytes);
}
