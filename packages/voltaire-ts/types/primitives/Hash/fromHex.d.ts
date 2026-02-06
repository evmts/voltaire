/**
 * Create Hash from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {string} hex - Hex string with optional 0x prefix
 * @returns {import('./HashType.js').HashType} Hash bytes
 * @throws {InvalidLengthError} If hex is wrong length
 * @throws {InvalidFormatError} If hex contains invalid characters
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.fromHex('0x1234...');
 * const hash2 = Hash.fromHex('1234...'); // 0x prefix optional
 * ```
 */
export function fromHex(hex: string): import("./HashType.js").HashType;
//# sourceMappingURL=fromHex.d.ts.map