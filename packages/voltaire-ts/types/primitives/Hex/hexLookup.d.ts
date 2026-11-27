/**
 * Precomputed hex lookup tables shared by every byte <-> hex conversion.
 *
 * Encoding a byte with `byte.toString(16).padStart(2, "0")` allocates two
 * intermediate strings per byte and was the dominant cost in Address, Hash,
 * Hex, and every primitive `toHex`. A 256-entry table turns it into one
 * indexed load. Decoding through `Number.parseInt(str.slice(i, i + 2), 16)`
 * allocated a substring per byte; the nibble table decodes from char codes.
 *
 * @internal
 */
/**
 * Two-character lowercase hex string for every byte value 0x00..0xff.
 * @internal
 * @type {readonly string[]}
 */
export const HEX_BYTE_TABLE: readonly string[];
/**
 * Nibble value for every ASCII code unit; -1 for non-hex characters.
 * Index with `code < 128 ? HEX_NIBBLE_TABLE[code] : -1`.
 * @internal
 * @type {Int8Array}
 */
export const HEX_NIBBLE_TABLE: Int8Array;
//# sourceMappingURL=hexLookup.d.ts.map