/**
 * Get minimum of two values
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} Minimum value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(50n);
 * const min = Uint128.minimum(a, b); // 50n
 * ```
 */
export function minimum(uint: import("./Uint128Type.js").Uint128Type, b: import("./Uint128Type.js").Uint128Type): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=minimum.d.ts.map