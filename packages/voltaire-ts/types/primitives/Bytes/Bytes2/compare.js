/**
 * Compare two Bytes2 values lexicographically (byte-by-byte from left to right).
 *
 * @param {import('./Bytes2Type.js').Bytes2Type} a - First Bytes2
 * @param {import('./Bytes2Type.js').Bytes2Type} b - Second Bytes2
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 *
 * @example
 * ```typescript
 * Bytes2.compare(Bytes2.fromHex("0x0001"), Bytes2.fromHex("0x0002")); // -1
 *
 * // Compatible with Array.sort
 * const sorted = [b3, b1, b2].sort(Bytes2.compare);
 * ```
 */
export function compare(a, b) {
    for (let i = 0; i < 2; i++) {
        const ai = /** @type {number} */ (a[i]);
        const bi = /** @type {number} */ (b[i]);
        if (ai < bi)
            return -1;
        if (ai > bi)
            return 1;
    }
    return 0;
}
