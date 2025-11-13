import { MAX } from "./constants.js";

/**
 * Bitwise NOT operation
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Operand
 * @returns {import('./BrandedUint128.js').BrandedUint128} ~uint (masked to 128 bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(0n);
 * const result = Uint128.bitwiseNot(a); // MAX
 * ```
 */
export function bitwiseNot(uint) {
	return MAX ^ uint;
}
