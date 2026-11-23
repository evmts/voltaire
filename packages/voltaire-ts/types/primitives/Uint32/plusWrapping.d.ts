/**
 * Add two Uint32 values with wrapping
 *
 * Returns the exact result modulo 2^32 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} a - First operand
 * @param {import('./Uint32Type.js').Uint32Type} b - Second operand
 * @returns {import('./Uint32Type.js').Uint32Type} Sum (a + b) mod 2^32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * Uint32.plusWrapping(Uint32.MAX, Uint32.ONE); // 0
 * ```
 */
export function plusWrapping(a: import("./Uint32Type.js").Uint32Type, b: import("./Uint32Type.js").Uint32Type): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=plusWrapping.d.ts.map