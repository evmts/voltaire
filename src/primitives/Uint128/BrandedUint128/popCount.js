/**
 * Count number of set bits
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Value to count
 * @returns {number} Number of 1 bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(0xffn);
 * Uint128.popCount(a); // 8
 * ```
 */
export function popCount(uint) {
	let count = 0;
	let val = uint;
	while (val > 0n) {
		count += Number(val & 1n);
		val = val >> 1n;
	}
	return count;
}
