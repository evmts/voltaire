/**
 * Create Uint16 from Uint8Array (2 bytes, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Uint8Array (must be exactly 2 bytes)
 * @returns {import('./Uint16Type.js').Uint16Type} Uint16 value
 * @throws {Uint16InvalidLengthError} If bytes length is not 2
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const bytes = new Uint8Array([0xff, 0xff]);
 * const value = Uint16.fromBytes(bytes); // 65535
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./Uint16Type.js").Uint16Type;
//# sourceMappingURL=fromBytes.d.ts.map