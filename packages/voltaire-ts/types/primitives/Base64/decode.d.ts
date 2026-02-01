/**
 * Decode standard base64 string to bytes
 *
 * @see https://voltaire.tevm.sh/primitives/base64 for Base64 documentation
 * @since 0.0.0
 * @param {string} encoded - Base64 string to decode
 * @returns {Uint8Array} Decoded bytes
 * @throws {DecodingError} If input is invalid base64
 * @example
 * ```javascript
 * import * as Base64 from './primitives/Base64/index.js';
 * const decoded = Base64.decode('SGVsbG8=');
 * // Uint8Array([72, 101, 108, 108, 111])
 * ```
 */
export function decode(encoded: string): Uint8Array;
//# sourceMappingURL=decode.d.ts.map