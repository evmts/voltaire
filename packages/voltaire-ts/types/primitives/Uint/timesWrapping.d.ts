/**
 * Multiply two Uint256 values with wrapping
 *
 * Returns the exact result modulo 2^256 and never throws. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint256 documentation
 * @since 0.0.0
 * @param {import('./Uint256Type.js').Uint256Type} a - First operand
 * @param {import('./Uint256Type.js').Uint256Type} b - Second operand
 * @returns {import('./Uint256Type.js').Uint256Type} Product (a * b) mod 2^256
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * Uint256.timesWrapping(Uint256.MAX, Uint256.from(2n)); // Uint256.MAX - 1n
 * ```
 */
export function timesWrapping(a: import("./Uint256Type.js").Uint256Type, b: import("./Uint256Type.js").Uint256Type): import("./Uint256Type.js").Uint256Type;
//# sourceMappingURL=timesWrapping.d.ts.map