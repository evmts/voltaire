/**
 * Check if two Bytes64 values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {import('./Bytes64Type.js').Bytes64Type} a - First value
 * @param {import('./Bytes64Type.js').Bytes64Type} b - Second value
 * @returns {boolean} True if equal
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const equal = Bytes64.equals(a, b);
 * ```
 */
export function equals(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
