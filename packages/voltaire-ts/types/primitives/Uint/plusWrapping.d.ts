/**
 * Add two Uint256 values with wrapping
 *
 * Returns the exact result modulo 2^256 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint256 documentation
 * @since 0.0.0
 * @param {import('./Uint256Type.js').Uint256Type} a - First operand
 * @param {import('./Uint256Type.js').Uint256Type} b - Second operand
 * @returns {import('./Uint256Type.js').Uint256Type} Sum (a + b) mod 2^256
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * Uint256.plusWrapping(Uint256.MAX, Uint256.ONE); // 0n
 * ```
 */
export function plusWrapping(a: import("./Uint256Type.js").Uint256Type, b: import("./Uint256Type.js").Uint256Type): import("./Uint256Type.js").Uint256Type;
//# sourceMappingURL=plusWrapping.d.ts.map