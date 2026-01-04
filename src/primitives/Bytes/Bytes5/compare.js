/**
 * Compare two Bytes5 values lexicographically (byte-by-byte from left to right).
 *
 * @param {import('./Bytes5Type.js').Bytes5Type} a - First Bytes5
 * @param {import('./Bytes5Type.js').Bytes5Type} b - Second Bytes5
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 *
 * @example
 * ```typescript
 * Bytes5.compare(Bytes5.fromHex("0x0000000001"), Bytes5.fromHex("0x0000000002")); // -1
 *
 * // Compatible with Array.sort
 * const sorted = [b3, b1, b2].sort(Bytes5.compare);
 * ```
 */
export function compare(a, b) {
	for (let i = 0; i < 5; i++) {
		const ai = /** @type {number} */ (a[i]);
		const bi = /** @type {number} */ (b[i]);
		if (ai < bi) return -1;
		if (ai > bi) return 1;
	}
	return 0;
}
