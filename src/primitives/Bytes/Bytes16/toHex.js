/**
 * Convert Bytes16 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes16.ts').BrandedBytes16} bytes - Bytes16 to convert
 * @returns {string} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const hex = Bytes16.toHex(bytes);
 * // "0x1234567890abcdef1234567890abcdef"
 * ```
 */
export function toHex(bytes) {
	let result = "0x";
	for (let i = 0; i < bytes.length; i++) {
		result += bytes[i].toString(16).padStart(2, "0");
	}
	return result;
}
