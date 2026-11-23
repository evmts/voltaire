/**
 * Add two Uint8 values with wrapping
 *
 * Returns the exact result modulo 2^8 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./Uint8Type.js').Uint8Type} a - First operand
 * @param {import('./Uint8Type.js').Uint8Type} b - Second operand
 * @returns {import('./Uint8Type.js').Uint8Type} Sum (a + b) mod 2^8
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * Uint8.plusWrapping(Uint8.MAX, Uint8.ONE); // 0
 * ```
 */
export function plusWrapping(a: import("./Uint8Type.js").Uint8Type, b: import("./Uint8Type.js").Uint8Type): import("./Uint8Type.js").Uint8Type;
//# sourceMappingURL=plusWrapping.d.ts.map