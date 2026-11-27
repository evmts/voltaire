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
export function decodeHexDigitsInto(str: string, offset: number, out: Uint8Array): number;
//# sourceMappingURL=decodeHexDigitsInto.d.ts.map