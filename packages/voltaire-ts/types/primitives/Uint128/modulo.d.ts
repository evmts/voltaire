/**
 * Modulo operation
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Dividend
 * @param {import('./Uint128Type.js').Uint128Type} b - Divisor
 * @returns {import('./Uint128Type.js').Uint128Type} Remainder (uint % b)
 * @throws {Uint128DivisionByZeroError} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(7n);
 * const remainder = Uint128.modulo(a, b); // 2n
 * ```
 */
export function modulo(uint: import("./Uint128Type.js").Uint128Type, b: import("./Uint128Type.js").Uint128Type): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=modulo.d.ts.map