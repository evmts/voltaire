/**
 * Count leading zeros in Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Value
 * @returns {number} Number of leading zero bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(255n);
 * const result = Uint64.leadingZeros(a); // 56
 * ```
 */
export function leadingZeros(uint: import("./Uint64Type.js").Uint64Type): number;
//# sourceMappingURL=leadingZeros.d.ts.map