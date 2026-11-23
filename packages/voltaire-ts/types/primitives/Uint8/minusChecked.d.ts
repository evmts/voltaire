/**
 * Subtract two Uint8 values with underflow checking
 *
 * Throws when the exact result does not fit in 8 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {import('./Uint8Type.js').Uint8Type} Difference (a - b)
 * @throws {Uint8UnderflowError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * Uint8.minusChecked(Uint8.from(5), Uint8.from(3)); // 2
 * Uint8.minusChecked(Uint8.from(0), Uint8.from(1)); // throws Uint8UnderflowError
 * ```
 */
export function minusChecked(a: import("./Uint8Type.js").Uint8Type, b: import("./Uint8Type.js").Uint8Type): import("./Uint8Type.js").Uint8Type;
//# sourceMappingURL=minusChecked.d.ts.map