/**
 * Count number of set bits (population count) in Uint16 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Input value
 * @returns {number} Number of set bits (0-16)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * Uint16.popCount(Uint16.from(0)); // 0
 * Uint16.popCount(Uint16.from(65535)); // 16
 * Uint16.popCount(Uint16.from(0b1010101010101010)); // 8
 * ```
 */
export function popCount(uint) {
	let count = 0;
	let n = uint;
	while (n > 0) {
		count += n & 1;
		n >>>= 1;
	}
	return count;
}
