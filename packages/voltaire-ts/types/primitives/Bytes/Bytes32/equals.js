/**
 * Check if two Bytes32 values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./Bytes32Type.js').Bytes32Type} a - First value
 * @param {import('./Bytes32Type.js').Bytes32Type} b - Second value
 * @returns {boolean} True if equal
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const equal = Bytes32.equals(a, b);
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
