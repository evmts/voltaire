/**
 * Check if two Bytes are equal
 *
 * WARNING: This function is NOT constant-time. It returns early on the first
 * byte mismatch, which can leak timing information. Do NOT use for comparing:
 * - Cryptographic hashes
 * - MACs or signatures
 * - Passwords or secret tokens
 *
 * For security-sensitive comparisons, use `equalsConstantTime()` instead.
 *
 * @param {import('./BytesType.js').BytesType} a - First Bytes
 * @param {import('./BytesType.js').BytesType} b - Second Bytes
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const equal = Bytes.equals(bytes1, bytes2);
 * ```
 */
export function equals(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
