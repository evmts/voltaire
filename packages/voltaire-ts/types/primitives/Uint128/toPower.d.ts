/**
 * Power operation with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./Uint128Type.js').Uint128Type} uint - Base
 * @param {import('./Uint128Type.js').Uint128Type} exponent - Exponent
 * @returns {import('./Uint128Type.js').Uint128Type} Result (uint ^ exponent) mod 2^128
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const base = Uint128.from(2n);
 * const exp = Uint128.from(10n);
 * const result = Uint128.toPower(base, exp); // 1024n
 * ```
 */
export function toPower(uint: import("./Uint128Type.js").Uint128Type, exponent: import("./Uint128Type.js").Uint128Type): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=toPower.d.ts.map