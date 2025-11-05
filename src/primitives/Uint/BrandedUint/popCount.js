/**
 * Count number of set bits (population count)
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to check
 * @returns {number} Number of 1 bits
 *
 * @example
 * ```typescript
 * const a = Uint(0xffn);
 * const count1 = Uint.popCount(a); // 8
 * const count2 = a.popCount(); // 8
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
