/**
 * Convert number to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {number} value - Number to convert (must be safe integer)
 * @param {number} [size] - Optional byte size for padding
 * @returns {import('./HexType.js').HexType} Hex string
 * @throws {NegativeNumberError} If value is negative
 * @throws {UnsafeIntegerError} If value exceeds Number.MAX_SAFE_INTEGER
 * @throws {NonIntegerError} If value is not an integer
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromNumber(255);     // '0xff'
 * Hex.fromNumber(255, 2);  // '0x00ff'
 * Hex.fromNumber(0x1234);  // '0x1234'
 * ```
 */
export function fromNumber(value: number, size?: number): import("./HexType.js").HexType;
//# sourceMappingURL=fromNumber.d.ts.map