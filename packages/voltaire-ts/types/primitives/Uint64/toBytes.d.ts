/**
 * Convert Uint64 to bytes (big-endian, 8 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Uint64 value to convert
 * @returns {Uint8Array} 8-byte Uint8Array
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.from(255n);
 * const bytes = Uint64.toBytes(value);
 * ```
 */
export function toBytes(uint: import("./Uint64Type.js").Uint64Type): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map