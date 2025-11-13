/**
 * Count number of set bits (population count) in Uint8 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Input value
 * @returns {number} Number of set bits (0-8)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * Uint8.popCount(Uint8.from(0)); // 0
 * Uint8.popCount(Uint8.from(255)); // 8
 * Uint8.popCount(Uint8.from(0b10101010)); // 4
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
