/**
 * Create a copy of a Uint256 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./Uint256Type.js').Uint256Type} uint - Uint256 value to clone
 * @returns {import('./Uint256Type.js').Uint256Type} Copy of the value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const n1 = Uint256.from(100n);
 * const n2 = Uint256.clone(n1);
 * console.log(Uint256.equals(n1, n2)); // true
 * ```
 */
export function clone(uint: import("./Uint256Type.js").Uint256Type): import("./Uint256Type.js").Uint256Type;
//# sourceMappingURL=clone.d.ts.map