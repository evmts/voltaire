/**
 * Check if Int64 value is zero
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Value
 * @returns {boolean} True if zero
 */
export function isZero(value) {
    return value === 0n;
}
