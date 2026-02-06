/**
 * Convert Bytes8 to generic Bytes
 *
 * @param {import('./Bytes8Type.js').Bytes8Type} bytes - Bytes8 to convert
 * @returns {import('../BytesType.js').BytesType} Generic Bytes
 *
 * @example
 * ```typescript
 * const genericBytes = Bytes8.toBytes(bytes);
 * ```
 */
export function toBytes(bytes) {
    return /** @type {import('../BytesType.js').BytesType} */ (
    /** @type {unknown} */ (bytes));
}
