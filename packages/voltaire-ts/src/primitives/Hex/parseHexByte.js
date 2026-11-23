import { HEX_NIBBLE_TABLE } from "./hexLookup.js";

/**
 * Parse the two hex digits at `str[index]` and `str[index + 1]`.
 *
 * Exactly equivalent to `Number.parseInt(str.slice(index, index + 2), 16)`
 * for every input, without allocating a substring when both characters are
 * hex digits. Any other input (non-hex, whitespace, sign, `0x`, out of range)
 * falls back to that expression, so callers keep their NaN checks and
 * coercion behavior unchanged.
 *
 * @internal
 * @param {string} str - Source string
 * @param {number} index - Index of the high digit
 * @returns {number} Byte value 0-255, or whatever `Number.parseInt` yields for non-hex input
 * @example
 * ```javascript
 * parseHexByte("0xff", 2); // 255
 * parseHexByte("zz", 0); // NaN
 * ```
 */
export function parseHexByte(str, index) {
	const hiCode = str.charCodeAt(index);
	const loCode = str.charCodeAt(index + 1);
	if (hiCode < 128 && loCode < 128) {
		const hi = /** @type {number} */ (HEX_NIBBLE_TABLE[hiCode]);
		const lo = /** @type {number} */ (HEX_NIBBLE_TABLE[loCode]);
		if (hi >= 0 && lo >= 0) return (hi << 4) | lo;
	}
	return Number.parseInt(str.slice(index, index + 2), 16);
}
