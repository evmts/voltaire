/**
 * Shift right operation
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Value to shift
 * @param {number | bigint} bits - Number of bits to shift
 * @returns {import('./Uint128Type.js').Uint128Type} uint >> bits
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(256n);
 * const result = Uint128.shiftRight(a, 8); // 1n
 * ```
 */
export function shiftRight(uint: import("./Uint128Type.js").Uint128Type, bits: number | bigint): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=shiftRight.d.ts.map