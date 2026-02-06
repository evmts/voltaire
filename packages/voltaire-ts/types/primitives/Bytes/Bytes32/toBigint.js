/**
 * Convert Bytes32 to bigint (big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes - Bytes32 to convert
 * @returns {bigint} Bigint value
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const value = Bytes32.toBigint(bytes);
 * ```
 */
export function toBigint(bytes) {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
        result = (result << 8n) | BigInt(/** @type {number} */ (bytes[i]));
    }
    return result;
}
