/**
 * Create Uint64 from bytes (big-endian, 8 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - byte array (must be exactly 8 bytes)
 * @returns {import('./Uint64Type.js').Uint64Type} Uint64 value
 * @throws {Uint64InvalidLengthError} If bytes length is not 8
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255]);
 * const value = Uint64.fromBytes(bytes); // 255n
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=fromBytes.d.ts.map