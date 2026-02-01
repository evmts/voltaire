/**
 * Pad hex to right (suffix with zeros)
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to pad
 * @param {number} targetSize - Target size in bytes (must be non-negative integer)
 * @returns {string} Right-padded hex string
 * @throws {InvalidSizeError} If targetSize is not a non-negative integer
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const padded = Hex.padRight(hex, 4); // '0x12340000'
 * Hex.padRight('0x1234', -1); // throws InvalidSizeError
 * Hex.padRight('0x1234', 1.5); // throws InvalidSizeError
 * ```
 */
export function padRight(hex: string, targetSize: number): string;
//# sourceMappingURL=padRight.d.ts.map