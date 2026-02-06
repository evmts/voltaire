/**
 * Create Bytes64 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {string} hex - Hex string with optional 0x prefix
 * @returns {import('./Bytes64Type.js').Bytes64Type} Bytes64
 * @throws {InvalidLengthError} If hex is wrong length
 * @throws {InvalidFormatError} If hex contains invalid characters
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const bytes = Bytes64.fromHex('0x' + '1234'.repeat(32));
 * ```
 */
export function fromHex(hex: string): import("./Bytes64Type.js").Bytes64Type;
//# sourceMappingURL=fromHex.d.ts.map