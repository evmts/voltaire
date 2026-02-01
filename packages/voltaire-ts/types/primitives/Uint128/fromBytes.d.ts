/**
 * Create Uint128 from bytes (big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array (up to 16 bytes)
 * @returns {import('./Uint128Type.js').Uint128Type} Uint128 value
 * @throws {Uint128InvalidLengthError} If bytes length exceeds 16
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255]);
 * const value = Uint128.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=fromBytes.d.ts.map