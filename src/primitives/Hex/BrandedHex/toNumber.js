import { InvalidRangeError } from "../../errors/index.js";

/**
 * Convert hex to number
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to convert
 * @returns {number} Number value
 * @throws {InvalidRangeError} If hex represents value larger than MAX_SAFE_INTEGER
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0xff');
 * const num = Hex.toNumber(hex); // 255
 * ```
 */
export function toNumber(hex) {
	const num = Number.parseInt(hex.slice(2), 16);
	if (!Number.isSafeInteger(num)) {
		throw new InvalidRangeError("Hex value exceeds MAX_SAFE_INTEGER", {
			code: "HEX_VALUE_TOO_LARGE",
			value: hex,
			expected: `value <= ${Number.MAX_SAFE_INTEGER}`,
			context: { parsedValue: num, maxSafeInteger: Number.MAX_SAFE_INTEGER },
			docsPath: "/primitives/hex#error-handling",
		});
	}
	return num;
}
