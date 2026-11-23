import { HEX_NIBBLE_TABLE } from "./hexLookup.js";

/**
 * Decode `out.length` bytes of hex digits from `str`, starting at `offset`.
 *
 * Returns the index (relative to `offset`) of the first non-hex character,
 * or -1 when every digit was valid. On failure `out` is partially written
 * and must be discarded. Callers own length validation and error reporting.
 *
 * @internal
 * @param {string} str - Source string
 * @param {number} offset - Index of the first hex digit in `str`
 * @param {Uint8Array} out - Destination; decodes exactly `out.length` bytes
 * @returns {number} -1 on success, else the relative index of the first invalid character
 * @example
 * ```javascript
 * const out = new Uint8Array(2);
 * decodeHexDigitsInto("0x12ab", 2, out); // -1, out = [0x12, 0xab]
 * ```
 */
export function decodeHexDigitsInto(str, offset, out) {
	for (let i = 0; i < out.length; i++) {
		const j = offset + i * 2;
		const hiCode = str.charCodeAt(j);
		const loCode = str.charCodeAt(j + 1);
		const hi =
			hiCode < 128 ? /** @type {number} */ (HEX_NIBBLE_TABLE[hiCode]) : -1;
		const lo =
			loCode < 128 ? /** @type {number} */ (HEX_NIBBLE_TABLE[loCode]) : -1;
		if (hi < 0) return i * 2;
		if (lo < 0) return i * 2 + 1;
		out[i] = (hi << 4) | lo;
	}
	return -1;
}
