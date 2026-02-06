/**
 * Check if Uint32 value is less than another
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - First value
 * @param {import('./Uint32Type.js').Uint32Type} b - Second value
 * @returns {boolean} true if uint < b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(200);
 * const result = Uint32.lessThan(a, b); // true
 * ```
 */
export function lessThan(uint: import("./Uint32Type.js").Uint32Type, b: import("./Uint32Type.js").Uint32Type): boolean;
//# sourceMappingURL=lessThan.d.ts.map