import { MAX } from "./constants.js";

/**
 * Add Uint128 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Sum (uint + b) mod 2^128
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(50n);
 * const sum = Uint128.plus(a, b); // 150n
 * ```
 */
export function plus(uint, b) {
	const sum = uint + b;
	return /** @type {import('./Uint128Type.js').Uint128Type} */ (sum & MAX);
}
