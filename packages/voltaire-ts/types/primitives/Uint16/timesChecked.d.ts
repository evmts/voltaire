/**
 * Multiply two Uint16 values with overflow checking
 *
 * Throws when the exact result does not fit in 16 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {import('./Uint16Type.js').Uint16Type} Product (a * b)
 * @throws {Uint16OverflowError} If the result exceeds 2^16 - 1
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * Uint16.timesChecked(Uint16.from(5), Uint16.from(3)); // 15
 * Uint16.timesChecked(Uint16.MAX, Uint16.from(2)); // throws Uint16OverflowError
 * ```
 */
export function timesChecked(a: import("./Uint16Type.js").Uint16Type, b: import("./Uint16Type.js").Uint16Type): import("./Uint16Type.js").Uint16Type;
//# sourceMappingURL=timesChecked.d.ts.map