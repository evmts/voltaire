import { MAX } from "./constants.js";

/**
 * Subtract Uint128 value with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./../Uint128Type.js').Uint128Type} uint - First operand
 * @param {import('./../Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./../Uint128Type.js').Uint128Type} Difference (uint - b) mod 2^128
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(50n);
 * const diff = Uint128.minus(a, b); // 50n
 * ```
 */
export function minus(uint, b) {
	const diff = uint - b;
	return diff < 0n ? (diff + MAX + 1n) & MAX : diff;
}
