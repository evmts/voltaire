/**
 * Create Uint64 from ABI-encoded bytes (32 bytes, big-endian, left-padded)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - ABI-encoded byte array (32 bytes)
 * @returns {import('./Uint64Type.js').Uint64Type} Uint64 value
 * @throws {Uint64InvalidLengthError} If bytes length is not 32
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const abiBytes = new Uint8Array(32);
 * abiBytes[31] = 255;
 * const value = Uint64.fromAbiEncoded(abiBytes); // 255n
 * ```
 */
export function fromAbiEncoded(bytes: Uint8Array): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=fromAbiEncoded.d.ts.map