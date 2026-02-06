/**
 * Compare two Bytes32 values lexicographically (byte-by-byte from left to right).
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./Bytes32Type.js').Bytes32Type} a - First value
 * @param {import('./Bytes32Type.js').Bytes32Type} b - Second value
 * @returns {-1 | 0 | 1} Comparison result:
 *   - `-1` if `a` is less than `b`
 *   - `0` if `a` equals `b`
 *   - `1` if `a` is greater than `b`
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const result = Bytes32.compare(a, b);
 *
 * // Compatible with Array.sort
 * const sorted = [hash3, hash1, hash2].sort(Bytes32.compare);
 * ```
 */
export function compare(a, b) {
    for (let i = 0; i < a.length; i++) {
        const ai = /** @type {number} */ (a[i]);
        const bi = /** @type {number} */ (b[i]);
        if (ai < bi)
            return -1;
        if (ai > bi)
            return 1;
    }
    return 0;
}
