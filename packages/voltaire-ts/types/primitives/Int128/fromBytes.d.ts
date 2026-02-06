/**
 * Create Int128 from bytes (two's complement, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array (16 bytes)
 * @returns {import('./Int128Type.js').BrandedInt128} Int128 value
 * @throws {InvalidLengthError} If bytes length is incorrect
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const bytes = new Uint8Array(16);
 * bytes[15] = 0xff; // -1
 * const value = Int128.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=fromBytes.d.ts.map