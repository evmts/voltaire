/**
 * Convert Bytes32 to bigint (big-endian)
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes32 - Bytes32 to convert
 * @returns {bigint} Big-endian bigint representation
 *
 * @example
 * ```typescript
 * const value = Bytes32.toBigint(b32);
 * ```
 */
export function toBigint(bytes32) {
    let result = 0n;
    for (const byte of bytes32) {
        result = (result << 8n) | BigInt(byte);
    }
    return result;
}
