/**
 * Find maximum of multiple Uint256 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {...import('./Uint256Type.js').Uint256Type} values - Values to compare
 * @returns {import('./Uint256Type.js').Uint256Type} Maximum value
 * @throws {UintEmptyInputError} If no values provided
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const result = Uint256.max(Uint256.from(100n), Uint256.from(50n), Uint256.from(75n)); // 100n
 * ```
 */
export function max(...values: import("./Uint256Type.js").Uint256Type[]): import("./Uint256Type.js").Uint256Type;
//# sourceMappingURL=max.d.ts.map