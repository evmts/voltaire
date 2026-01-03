/**
 * Compare two Bytes6 values lexicographically (byte-by-byte from left to right).
 *
 * @param {import('./Bytes6Type.js').Bytes6Type} a - First Bytes6
 * @param {import('./Bytes6Type.js').Bytes6Type} b - Second Bytes6
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 *
 * @example
 * ```typescript
 * Bytes6.compare(Bytes6.fromHex("0x000000000001"), Bytes6.fromHex("0x000000000002")); // -1
 *
 * // Compatible with Array.sort
 * const sorted = [b3, b1, b2].sort(Bytes6.compare);
 * ```
 */
export function compare(a, b) {
	for (let i = 0; i < 6; i++) {
		const ai = /** @type {number} */ (a[i]);
		const bi = /** @type {number} */ (b[i]);
		if (ai < bi) return -1;
		if (ai > bi) return 1;
	}
	return 0;
}
