/**
 * Bitwise NOT of Int64 value
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Value
 * @returns {import('./Int64Type.js').BrandedInt64} Result
 */
export function bitwiseNot(value) {
    const result = ~value;
    return /** @type {import('./Int64Type.js').BrandedInt64} */ (result);
}
