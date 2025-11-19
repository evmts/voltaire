import { MAX } from "./constants.js";

/**
 * Multiply Uint128 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Product (uint * b) mod 2^128
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(10n);
 * const b = Uint128.from(5n);
 * const product = Uint128.times(a, b); // 50n
 * ```
 */
export function times(uint, b) {
	const product = uint * b;
	return product & MAX;
}
