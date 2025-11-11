import { SIZE } from "./BrandedHash.js";

/**
 * Check if value is a valid Hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedHash.js').BrandedHash} True if value is Hash type
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * if (Hash.isHash(value)) {
 *   // value is Hash
 * }
 * ```
 */
export function isHash(value) {
	return value instanceof Uint8Array && value.length === SIZE;
}
