/**
 * Convert Uint128 to bytes (big-endian, 16 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Uint128 value to convert
 * @returns {Uint8Array} 16-byte Uint8Array
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const value = Uint128.from(255n);
 * const bytes = Uint128.toBytes(value);
 * ```
 */
export function toBytes(uint: import("./Uint128Type.js").Uint128Type): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map