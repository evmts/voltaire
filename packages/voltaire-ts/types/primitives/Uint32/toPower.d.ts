/**
 * Raise Uint32 to power with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - Base
 * @param {import('./Uint32Type.js').Uint32Type} exp - Exponent
 * @returns {import('./Uint32Type.js').Uint32Type} Result (uint ^ exp) mod 2^32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const base = Uint32.from(2);
 * const exp = Uint32.from(10);
 * const result = Uint32.toPower(base, exp); // 1024
 * ```
 */
export function toPower(uint: import("./Uint32Type.js").Uint32Type, exp: import("./Uint32Type.js").Uint32Type): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=toPower.d.ts.map