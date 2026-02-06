/**
 * Compare two Bytes4 values lexicographically (byte-by-byte from left to right).
 *
 * @param {import('./Bytes4Type.js').Bytes4Type} a - First Bytes4
 * @param {import('./Bytes4Type.js').Bytes4Type} b - Second Bytes4
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 *
 * @example
 * ```typescript
 * Bytes4.compare(Bytes4.fromHex("0x00000001"), Bytes4.fromHex("0x00000002")); // -1
 *
 * // Compatible with Array.sort
 * const sorted = [selector3, selector1, selector2].sort(Bytes4.compare);
 * ```
 */
export function compare(a, b) {
    for (let i = 0; i < 4; i++) {
        const ai = /** @type {number} */ (a[i]);
        const bi = /** @type {number} */ (b[i]);
        if (ai < bi)
            return -1;
        if (ai > bi)
            return 1;
    }
    return 0;
}
