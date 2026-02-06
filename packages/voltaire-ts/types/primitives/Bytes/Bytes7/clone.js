/**
 * Clone Bytes7
 *
 * @param {import('./Bytes7Type.js').Bytes7Type} bytes - Bytes7 to clone
 * @returns {import('./Bytes7Type.js').Bytes7Type} Cloned Bytes7
 *
 * @example
 * ```typescript
 * const copy = Bytes7.clone(bytes);
 * ```
 */
export function clone(bytes) {
    return /** @type {import('./Bytes7Type.js').Bytes7Type} */ (new Uint8Array(bytes));
}
