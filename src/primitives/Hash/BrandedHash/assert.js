import { isHash } from "./isHash.js";

/**
 * Assert value is a Hash, throws if not
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {unknown} value - Value to assert
 * @param {string} [message] - Optional error message
 * @returns {asserts value is import('./BrandedHash.js').BrandedHash}
 * @throws {Error} If value is not a Hash
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * Hash.assert(value); // throws if not Hash
 * ```
 */
export function assert(value, message) {
	if (!isHash(value)) {
		throw new Error(message ?? "Value is not a Hash");
	}
}
