/**
 * Bitwise XOR of two Int32 values
 *
 * @param {import('./Int32Type.js').BrandedInt32} a - First value
 * @param {import('./Int32Type.js').BrandedInt32} b - Second value
 * @returns {import('./Int32Type.js').BrandedInt32} Result
 */
export function bitwiseXor(a, b) {
    const result = a ^ b;
    return /** @type {import('./Int32Type.js').BrandedInt32} */ (result);
}
