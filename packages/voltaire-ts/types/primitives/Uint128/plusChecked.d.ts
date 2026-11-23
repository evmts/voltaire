/**
 * Add two Uint128 values with overflow checking
 *
 * Throws when the exact result does not fit in 128 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} a - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Sum (a + b)
 * @throws {Uint128OverflowError} If the result exceeds 2^128 - 1
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * Uint128.plusChecked(Uint128.from(5n), Uint128.from(3n)); // 8n
 * Uint128.plusChecked(Uint128.MAX, Uint128.ONE); // throws Uint128OverflowError
 * ```
 */
export function plusChecked(a: import("./Uint128Type.js").Uint128Type, b: import("./Uint128Type.js").Uint128Type): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=plusChecked.d.ts.map