/**
 * Check if two CallData instances are equal (constant-time comparison)
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {import('./CallDataType.js').CallDataType} a - First CallData
 * @param {import('./CallDataType.js').CallDataType} b - Second CallData
 * @returns {boolean} True if instances are bytewise identical
 *
 * @example
 * ```javascript
 * const calldata1 = CallData.from("0xa9059cbb...");
 * const calldata2 = CallData.from("0xa9059cbb...");
 * console.log(CallData.equals(calldata1, calldata2)); // true
 * ```
 */
export function equals(a, b) {
    // Early length check (not timing-sensitive)
    if (a.length !== b.length) {
        return false;
    }
    // Constant-time comparison: always checks all bytes
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        const ai = /** @type {number} */ (a[i]);
        const bi = /** @type {number} */ (b[i]);
        result |= ai ^ bi;
    }
    return result === 0;
}
