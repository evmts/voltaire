/**
 * Raise Uint64 to power with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Base
 * @param {import('./Uint64Type.js').Uint64Type} exp - Exponent
 * @returns {import('./Uint64Type.js').Uint64Type} Result (uint ^ exp) mod 2^64
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const base = Uint64.from(2n);
 * const exp = Uint64.from(10n);
 * const result = Uint64.toPower(base, exp); // 1024n
 * ```
 */
export function toPower(uint: import("./Uint64Type.js").Uint64Type, exp: import("./Uint64Type.js").Uint64Type): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=toPower.d.ts.map