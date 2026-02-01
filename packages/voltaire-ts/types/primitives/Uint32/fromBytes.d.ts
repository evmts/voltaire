/**
 * Create Uint32 from bytes (big-endian, 4 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - byte array (must be exactly 4 bytes)
 * @returns {import('./Uint32Type.js').Uint32Type} Uint32 value
 * @throws {Uint32InvalidLengthError} If bytes length is not 4
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const bytes = new Uint8Array([0, 0, 0, 255]);
 * const value = Uint32.fromBytes(bytes); // 255
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=fromBytes.d.ts.map