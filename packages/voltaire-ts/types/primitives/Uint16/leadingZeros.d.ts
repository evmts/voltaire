/**
 * Count leading zero bits in Uint16 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./Uint16Type.js').Uint16Type} uint - Input value
 * @returns {number} Number of leading zero bits (0-16)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * Uint16.leadingZeros(Uint16.from(0)); // 16
 * Uint16.leadingZeros(Uint16.from(1)); // 15
 * Uint16.leadingZeros(Uint16.from(65535)); // 0
 * Uint16.leadingZeros(Uint16.from(32768)); // 0
 * ```
 */
export function leadingZeros(uint: import("./Uint16Type.js").Uint16Type): number;
//# sourceMappingURL=leadingZeros.d.ts.map