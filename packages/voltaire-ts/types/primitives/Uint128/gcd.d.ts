/**
 * Calculate greatest common divisor
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - First operand
 * @param {import('./Uint128Type.js').Uint128Type} b - Second operand
 * @returns {import('./Uint128Type.js').Uint128Type} GCD of uint and b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(48n);
 * const b = Uint128.from(18n);
 * const result = Uint128.gcd(a, b); // 6n
 * ```
 */
export function gcd(uint: import("./Uint128Type.js").Uint128Type, b: import("./Uint128Type.js").Uint128Type): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=gcd.d.ts.map