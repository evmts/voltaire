/**
 * Calculate the total length of the first RLP-encoded item in `bytes` and
 * validate canonical encoding of that item and of every item nested in it.
 *
 * Rejects, at any depth: a prefixed single byte below 0x80, long form for a
 * payload under 56 bytes, a length with a leading zero byte, an item that
 * overruns its parent list, and nesting deeper than MAX_DEPTH.
 *
 * @internal
 * @param {Uint8Array} bytes
 * @returns {number}
 * @throws {RlpDecodingError} If the item is truncated, non-canonical, or too deep
 */
export function getRlpItemLength(bytes: Uint8Array): number;
//# sourceMappingURL=getRlpItemLength.d.ts.map