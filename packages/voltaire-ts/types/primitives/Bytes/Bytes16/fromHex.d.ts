/**
 * Create Bytes16 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {string} hex - Hex string with optional 0x prefix
 * @returns {import('./Bytes16Type.js').Bytes16Type} Bytes16
 * @throws {InvalidLengthError} If hex is wrong length
 * @throws {InvalidFormatError} If hex contains invalid characters
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const bytes = Bytes16.fromHex('0x1234567890abcdef1234567890abcdef');
 * ```
 */
export function fromHex(hex: string): import("./Bytes16Type.js").Bytes16Type;
//# sourceMappingURL=fromHex.d.ts.map