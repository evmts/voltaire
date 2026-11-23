/**
 * Subtract two Uint32 values with underflow checking
 *
 * Throws when the exact result does not fit in 32 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} a - First operand
 * @param {import('./Uint32Type.js').Uint32Type} b - Second operand
 * @returns {import('./Uint32Type.js').Uint32Type} Difference (a - b)
 * @throws {Uint32NegativeError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * Uint32.minusChecked(Uint32.from(5), Uint32.from(3)); // 2
 * Uint32.minusChecked(Uint32.from(0), Uint32.from(1)); // throws Uint32NegativeError
 * ```
 */
export function minusChecked(a: import("./Uint32Type.js").Uint32Type, b: import("./Uint32Type.js").Uint32Type): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=minusChecked.d.ts.map