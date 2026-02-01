/**
 * Right shift Uint32 value (logical shift, zero-fill)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - Value to shift
 * @param {number} bits - Number of bits to shift (0-31)
 * @returns {import('./Uint32Type.js').Uint32Type} Result (uint >>> bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(256);
 * const result = Uint32.shiftRight(a, 8); // 1
 * ```
 */
export function shiftRight(uint: import("./Uint32Type.js").Uint32Type, bits: number): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=shiftRight.d.ts.map