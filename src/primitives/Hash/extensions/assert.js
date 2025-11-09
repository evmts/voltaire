import { isHash } from "./isHash.js";

/**
 * Assert value is a Hash, throws if not
 *
 * @param {unknown} value - Value to assert
 * @param {string} [message] - Optional error message
 * @returns {asserts value is import('./BrandedHash.ts').BrandedHash}
 * @throws {Error} If value is not a Hash
 *
 * @example
 * ```js
 * Hash.assert(value); // throws if not Hash
 * ```
 */
export function assert(value, message) {
	if (!isHash(value)) {
		throw new Error(message ?? "Value is not a Hash");
	}
}
