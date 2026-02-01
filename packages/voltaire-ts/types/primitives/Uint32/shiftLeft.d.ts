/**
 * Left shift Uint32 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./Uint32Type.js').Uint32Type} uint - Value to shift
 * @param {number} bits - Number of bits to shift (0-31)
 * @returns {import('./Uint32Type.js').Uint32Type} Result (uint << bits) mod 2^32
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(1);
 * const result = Uint32.shiftLeft(a, 8); // 256
 * ```
 */
export function shiftLeft(uint: import("./Uint32Type.js").Uint32Type, bits: number): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=shiftLeft.d.ts.map