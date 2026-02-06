/**
 * Concatenate multiple Bytes
 *
 * @param {...import('./BytesType.js').BytesType} arrays - Bytes to concatenate
 * @returns {import('./BytesType.js').BytesType} Concatenated Bytes
 *
 * @example
 * ```typescript
 * const result = Bytes.concat(bytes1, bytes2, bytes3);
 * ```
 */
export function concat(...arrays) {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return /** @type {import('./BytesType.js').BytesType} */ (result);
}
