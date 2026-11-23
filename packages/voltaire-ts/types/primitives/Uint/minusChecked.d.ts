/**
 * Subtract two Uint256 values with underflow checking
 *
 * Throws when the exact result does not fit in 256 bits. Every Uint size
 * exposes this function with the same semantics.
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint256 documentation
 * @since 0.0.0
 * @param {import('./Uint256Type.js').Uint256Type} a - First operand
 * @param {import('./Uint256Type.js').Uint256Type} b - Second operand
 * @returns {import('./Uint256Type.js').Uint256Type} Difference (a - b)
 * @throws {UintNegativeError} If the result is negative
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * Uint256.minusChecked(Uint256.from(5n), Uint256.from(3n)); // 2n
 * Uint256.minusChecked(Uint256.from(0n), Uint256.from(1n)); // throws UintNegativeError
 * ```
 */
export function minusChecked(a: import("./Uint256Type.js").Uint256Type, b: import("./Uint256Type.js").Uint256Type): import("./Uint256Type.js").Uint256Type;
//# sourceMappingURL=minusChecked.d.ts.map