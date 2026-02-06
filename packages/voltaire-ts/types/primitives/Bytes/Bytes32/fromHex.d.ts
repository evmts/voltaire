/**
 * Create Bytes32 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {string} hex - Hex string with optional 0x prefix
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 * @throws {InvalidLengthError} If hex is wrong length
 * @throws {InvalidFormatError} If hex contains invalid characters
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const bytes = Bytes32.fromHex('0x' + '1234'.repeat(16));
 * ```
 */
export function fromHex(hex: string): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=fromHex.d.ts.map