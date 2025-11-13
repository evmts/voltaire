/**
 * Count number of set bits (population count)
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to check
 * @returns {number} Number of 1 bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(0xffn);
 * const count = Uint256.popCount(a); // 8
 * ```
 */
export function popCount(uint) {
	let count = 0;
	let v = uint;
	while (v > 0n) {
		count++;
		v = v & (v - 1n);
	}
	return count;
}
