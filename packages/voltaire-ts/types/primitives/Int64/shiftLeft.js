/**
 * Shift Int64 left by n bits
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Value to shift
 * @param {bigint} n - Number of bits to shift
 * @returns {import('./Int64Type.js').BrandedInt64} Result
 */
export function shiftLeft(value, n) {
    const result = value << n;
    // Mask to 64 bits
    const mask = (1n << 64n) - 1n;
    const masked = result & mask;
    // Convert to signed
    if (masked >= 1n << 63n) {
        return /** @type {import('./Int64Type.js').BrandedInt64} */ (masked - (1n << 64n));
    }
    return /** @type {import('./Int64Type.js').BrandedInt64} */ (masked);
}
