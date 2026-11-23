/**
 * Subtract two Uint16 values with wrapping
 *
 * Returns the exact result modulo 2^16 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} a - First operand
 * @param {import('./Uint16Type.js').Uint16Type} b - Second operand
 * @returns {import('./Uint16Type.js').Uint16Type} Difference (a - b) mod 2^16
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * Uint16.minusWrapping(Uint16.from(0), Uint16.from(1)); // Uint16.MAX
 * ```
 */
export function minusWrapping(a: import("./Uint16Type.js").Uint16Type, b: import("./Uint16Type.js").Uint16Type): import("./Uint16Type.js").Uint16Type;
//# sourceMappingURL=minusWrapping.d.ts.map