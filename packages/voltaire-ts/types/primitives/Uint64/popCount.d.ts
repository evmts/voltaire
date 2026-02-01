/**
 * Count set bits (population count) in Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Value
 * @returns {number} Number of set bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(0b1111n);
 * const result = Uint64.popCount(a); // 4
 * ```
 */
export function popCount(uint: import("./Uint64Type.js").Uint64Type): number;
//# sourceMappingURL=popCount.d.ts.map