/**
 * Count set bits (population count) in Uint32 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Value
 * @returns {number} Number of set bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(0b1111);
 * const result = Uint32.popCount(a); // 4
 * ```
 */
export function popCount(uint) {
	let count = 0;
	let n = uint;
	while (n) {
		count += n & 1;
		n = n >>> 1;
	}
	return count;
}
