/**
 * Clone Bytes4
 *
 * @param {import('./Bytes4Type.js').Bytes4Type} bytes - Bytes4 to clone
 * @returns {import('./Bytes4Type.js').Bytes4Type} Cloned Bytes4
 *
 * @example
 * ```typescript
 * const copy = Bytes4.clone(bytes);
 * ```
 */
export function clone(bytes) {
    return /** @type {import('./Bytes4Type.js').Bytes4Type} */ (new Uint8Array(bytes));
}
