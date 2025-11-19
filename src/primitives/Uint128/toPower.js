import { MAX } from "./constants.js";

/**
 * Power operation with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Base
 * @param {import('./Uint128Type.js').Uint128Type} exponent - Exponent
 * @returns {import('./Uint128Type.js').Uint128Type} Result (uint ^ exponent) mod 2^128
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const base = Uint128.from(2n);
 * const exp = Uint128.from(10n);
 * const result = Uint128.toPower(base, exp); // 1024n
 * ```
 */
export function toPower(uint, exponent) {
	if (exponent === 0n) {
		return 1n;
	}

	let result = 1n;
	let base = uint;
	let exp = exponent;

	while (exp > 0n) {
		if (exp & 1n) {
			result = (result * base) & MAX;
		}
		base = (base * base) & MAX;
		exp = exp >> 1n;
	}

	return result;
}
