/**
 * Compare two Bytes lexicographically (byte-by-byte comparison).
 *
 * **Return value semantics:**
 * - Returns `-1` if `a` is lexicographically less than `b`
 * - Returns `0` if `a` and `b` are equal
 * - Returns `1` if `a` is lexicographically greater than `b`
 *
 * Comparison proceeds byte-by-byte from the start. If all compared bytes
 * are equal, the shorter array is considered less than the longer one.
 *
 * Suitable for use with `Array.prototype.sort()`.
 *
 * @param {import('./BytesType.js').BytesType} a - First Bytes to compare
 * @param {import('./BytesType.js').BytesType} b - Second Bytes to compare
 * @returns {-1 | 0 | 1} Negative if a < b, zero if equal, positive if a > b
 *
 * @example
 * ```typescript
 * import * as Bytes from 'voltaire/Bytes';
 *
 * // Equal bytes
 * Bytes.compare(Bytes.from([1, 2]), Bytes.from([1, 2])); // => 0
 *
 * // First is less (byte value)
 * Bytes.compare(Bytes.from([1, 2]), Bytes.from([1, 3])); // => -1
 *
 * // First is greater (byte value)
 * Bytes.compare(Bytes.from([1, 3]), Bytes.from([1, 2])); // => 1
 *
 * // First is less (shorter length)
 * Bytes.compare(Bytes.from([1]), Bytes.from([1, 2]));    // => -1
 *
 * // First is greater (longer length)
 * Bytes.compare(Bytes.from([1, 2]), Bytes.from([1]));    // => 1
 *
 * // Sorting an array
 * const arr = [Bytes.from([2]), Bytes.from([1]), Bytes.from([3])];
 * arr.sort(Bytes.compare); // sorted: [[1], [2], [3]]
 * ```
 */
export function compare(a, b) {
	const minLen = Math.min(a.length, b.length);
	for (let i = 0; i < minLen; i++) {
		const ai = /** @type {number} */ (a[i]);
		const bi = /** @type {number} */ (b[i]);
		if (ai < bi) return -1;
		if (ai > bi) return 1;
	}
	if (a.length < b.length) return -1;
	if (a.length > b.length) return 1;
	return 0;
}
