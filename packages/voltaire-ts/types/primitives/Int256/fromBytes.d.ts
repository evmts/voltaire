/**
 * Create Int256 from bytes (two's complement, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array (32 bytes)
 * @returns {import('./Int256Type.js').BrandedInt256} Int256 value
 * @throws {InvalidLengthError} If bytes length is incorrect
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const bytes = new Uint8Array(32);
 * bytes[31] = 0xff; // -1
 * const value = Int256.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=fromBytes.d.ts.map