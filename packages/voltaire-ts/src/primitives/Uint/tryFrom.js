import { from } from "./from.js";

/**
 * Try to create Uint256, returns undefined if invalid (standard form)
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or string
 * @returns {import('./BrandedUint.js').BrandedUint | undefined} Uint256 value or undefined
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.tryFrom(100n); // Uint256
 * const b = Uint256.tryFrom(-1n); // undefined
 * const c = Uint256.tryFrom("invalid"); // undefined
 * ```
 */
export function tryFrom(value) {
	try {
		return from(value);
	} catch {
		return undefined;
	}
}
