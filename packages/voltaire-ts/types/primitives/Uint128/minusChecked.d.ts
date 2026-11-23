/**
 * Subtract two Uint128 values with underflow checking
 *
 * Throws when the exact result does not fit in 128 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} a - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Difference (a - b)
 * @throws {Uint128NegativeError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * Uint128.minusChecked(Uint128.from(5n), Uint128.from(3n)); // 2n
 * Uint128.minusChecked(Uint128.from(0n), Uint128.from(1n)); // throws Uint128NegativeError
 * ```
 */
export function minusChecked(a: import("./Uint128Type.js").Uint128Type, b: import("./Uint128Type.js").Uint128Type): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=minusChecked.d.ts.map