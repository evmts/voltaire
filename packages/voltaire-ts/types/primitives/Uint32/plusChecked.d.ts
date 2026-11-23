/**
 * Add two Uint32 values with overflow checking
 *
 * Throws when the exact result does not fit in 32 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} a - First operand
 * @param {import('./Uint32Type.js').Uint32Type} b - Second operand
 * @returns {import('./Uint32Type.js').Uint32Type} Sum (a + b)
 * @throws {Uint32OverflowError} If the result exceeds 2^32 - 1
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * Uint32.plusChecked(Uint32.from(5), Uint32.from(3)); // 8
 * Uint32.plusChecked(Uint32.MAX, Uint32.ONE); // throws Uint32OverflowError
 * ```
 */
export function plusChecked(a: import("./Uint32Type.js").Uint32Type, b: import("./Uint32Type.js").Uint32Type): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=plusChecked.d.ts.map