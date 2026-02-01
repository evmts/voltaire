/**
 * Get number of leading zero bits
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Value to check
 * @returns {number} Number of leading zeros (0-128)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(1n);
 * const zeros = Uint128.leadingZeros(a); // 127
 * ```
 */
export function leadingZeros(uint: import("./Uint128Type.js").Uint128Type): number;
//# sourceMappingURL=leadingZeros.d.ts.map