/**
 * Create Uint128 from ABI-encoded bytes
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 32-byte ABI-encoded value
 * @returns {import('./Uint128Type.js').Uint128Type} Uint128 value
 * @throws {Uint128InvalidLengthError} If bytes length is not 32
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const abiBytes = new Uint8Array(32); // 32 bytes with padding
 * abiBytes[31] = 255;
 * const value = Uint128.fromAbiEncoded(abiBytes);
 * ```
 */
export function fromAbiEncoded(bytes: Uint8Array): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=fromAbiEncoded.d.ts.map