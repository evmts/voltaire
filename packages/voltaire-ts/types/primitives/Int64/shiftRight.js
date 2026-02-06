/**
 * Arithmetic shift Int64 right by n bits (preserves sign)
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Value to shift
 * @param {bigint} n - Number of bits to shift
 * @returns {import('./Int64Type.js').BrandedInt64} Result
 */
export function shiftRight(value, n) {
    const result = value >> n;
    return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
