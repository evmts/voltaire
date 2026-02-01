/**
 * Slice Bytes
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to slice
 * @param {number} start - Start index
 * @param {number} [end] - End index (optional)
 * @returns {import('./BytesType.js').BytesType} Sliced Bytes
 *
 * @example
 * ```typescript
 * const slice = Bytes.slice(bytes, 0, 4);
 * ```
 */
export function slice(bytes, start, end) {
    return /** @type {import('./BytesType.js').BytesType} */ (bytes.slice(start, end));
}
