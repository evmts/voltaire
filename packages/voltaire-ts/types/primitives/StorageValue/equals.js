/**
 * @typedef {import('./StorageValueType.js').StorageValueType} StorageValueType
 */
/**
 * Compares two StorageValues for equality.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {StorageValueType} a - First StorageValue
 * @param {StorageValueType} b - Second StorageValue
 * @returns {boolean} - True if equal
 *
 * @example
 * ```typescript
 * const isEqual = StorageValue.equals(val1, val2);
 * ```
 */
export function equals(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    // Constant-time comparison
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= /** @type {number} */ (a[i]) ^ /** @type {number} */ (b[i]);
    }
    return result === 0;
}
