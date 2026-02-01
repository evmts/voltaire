/**
 * Convert hex to number
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./HexType.js').HexType} hex - Hex string to convert
 * @returns {number} Number value
 * @throws {InvalidRangeError} If hex represents value larger than MAX_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0xff');
 * const num = Hex.toNumber(hex); // 255
 * ```
 */
export function toNumber(hex: import("./HexType.js").HexType): number;
//# sourceMappingURL=toNumber.d.ts.map