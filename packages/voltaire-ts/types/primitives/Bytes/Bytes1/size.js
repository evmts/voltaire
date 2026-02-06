/**
 * Get size of Bytes1 (always 1)
 *
 * @param {import('./Bytes1Type.js').Bytes1Type} _bytes - Bytes1
 * @returns {1} Size (always 1)
 *
 * @example
 * ```typescript
 * const size = Bytes1.size(bytes); // 1
 * ```
 */
export function size(_bytes) {
    return 1;
}
