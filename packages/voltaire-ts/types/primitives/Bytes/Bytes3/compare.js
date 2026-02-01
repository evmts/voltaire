/**
 * Compare two Bytes3 values lexicographically (byte-by-byte from left to right).
 *
 * @param {import('./Bytes3Type.js').Bytes3Type} a - First Bytes3
 * @param {import('./Bytes3Type.js').Bytes3Type} b - Second Bytes3
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 *
 * @example
 * ```typescript
 * Bytes3.compare(Bytes3.fromHex("0x000001"), Bytes3.fromHex("0x000002")); // -1
 *
 * // Compatible with Array.sort
 * const sorted = [b3, b1, b2].sort(Bytes3.compare);
 * ```
 */
export function compare(a, b) {
    for (let i = 0; i < 3; i++) {
        const ai = /** @type {number} */ (a[i]);
        const bi = /** @type {number} */ (b[i]);
        if (ai < bi)
            return -1;
        if (ai > bi)
            return 1;
    }
    return 0;
}
