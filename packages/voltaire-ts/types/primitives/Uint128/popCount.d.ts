/**
 * Count number of set bits
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Value to count
 * @returns {number} Number of 1 bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(0xffn);
 * Uint128.popCount(a); // 8
 * ```
 */
export function popCount(uint: import("./Uint128Type.js").Uint128Type): number;
//# sourceMappingURL=popCount.d.ts.map