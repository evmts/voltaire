/**
 * Right shift Uint16 value (logical shift)
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} uint - Value to shift
 * @param {number} shift - Number of bits to shift (0-15)
 * @returns {import('./Uint16Type.js').Uint16Type} Right-shifted value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(0b1111111100000000);
 * const result = Uint16.shiftRight(a, 8); // 0b0000000011111111 = 255
 * ```
 */
export function shiftRight(uint: import("./Uint16Type.js").Uint16Type, shift: number): import("./Uint16Type.js").Uint16Type;
//# sourceMappingURL=shiftRight.d.ts.map