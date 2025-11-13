/**
 * Convert Bytes32 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes32.ts').BrandedBytes32} bytes - Bytes32 to convert
 * @returns {string} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const hex = Bytes32.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
	let result = "0x";
	for (let i = 0; i < bytes.length; i++) {
		result += bytes[i].toString(16).padStart(2, "0");
	}
	return result;
}
