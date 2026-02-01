/**
 * Clone a Bytes64 value
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {import('./Bytes64Type.js').Bytes64Type} bytes - Value to clone
 * @returns {import('./Bytes64Type.js').Bytes64Type} Cloned value
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const cloned = Bytes64.clone(bytes);
 * ```
 */
export function clone(bytes) {
    return /** @type {import('./Bytes64Type.js').Bytes64Type} */ (new Uint8Array(bytes));
}
