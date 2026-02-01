/**
 * Create Uint32 from ABI-encoded bytes (32 bytes, big-endian, left-padded)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - ABI-encoded byte array (32 bytes)
 * @returns {import('./Uint32Type.js').Uint32Type} Uint32 value
 * @throws {Uint32InvalidLengthError} If bytes length is not 32
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const abiBytes = new Uint8Array(32);
 * abiBytes[31] = 255;
 * const value = Uint32.fromAbiEncoded(abiBytes); // 255
 * ```
 */
export function fromAbiEncoded(bytes: Uint8Array): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=fromAbiEncoded.d.ts.map