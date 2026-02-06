/**
 * Product of array of values
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type[]} values - Array of values
 * @returns {import('./Uint128Type.js').Uint128Type} Product with wrapping
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const values = [Uint128.from(10n), Uint128.from(5n), Uint128.from(2n)];
 * const total = Uint128.product(values); // 100n
 * ```
 */
export function product(values: import("./Uint128Type.js").Uint128Type[]): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=product.d.ts.map