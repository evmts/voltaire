import { from } from "./from.js";

/**
 * Try to create Uint128, returns null on failure
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - Value to convert
 * @returns {import('./BrandedUint128.js').BrandedUint128 | null} Uint128 value or null
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const valid = Uint128.tryFrom(100n); // 100n
 * const invalid = Uint128.tryFrom(-1); // null
 * ```
 */
export function tryFrom(value) {
	try {
		return from(value);
	} catch {
		return null;
	}
}
