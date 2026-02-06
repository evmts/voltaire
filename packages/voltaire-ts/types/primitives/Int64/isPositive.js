/**
 * Check if Int64 value is positive
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Value
 * @returns {boolean} True if positive
 */
export function isPositive(value) {
    return value > 0n;
}
