/**
 * Convert Bytes64 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes64.ts').BrandedBytes64} bytes - Bytes64 to convert
 * @returns {string} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const hex = Bytes64.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	let result = "0x";
	for (let i = 0; i < bytes.length; i++) {
		result += bytes[i].toString(16).padStart(2, "0");
	}
	return result;
}
