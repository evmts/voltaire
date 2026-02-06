/**
 * Return minimum of two Uint64 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - First value
 * @param {import('./Uint64Type.js').Uint64Type} b - Second value
 * @returns {import('./Uint64Type.js').Uint64Type} Minimum value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(200n);
 * const result = Uint64.minimum(a, b); // 100n
 * ```
 */
export function minimum(uint: import("./Uint64Type.js").Uint64Type, b: import("./Uint64Type.js").Uint64Type): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=minimum.d.ts.map