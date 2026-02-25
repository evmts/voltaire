/**
 * Convert a byte array key to nibbles (half-bytes).
 * Each byte produces two nibbles (high, low).
 *
 * @param {Uint8Array} key
 * @returns {Uint8Array} Nibble array (length = key.length * 2)
 */
export function keyToNibbles(key: Uint8Array): Uint8Array;
/**
 * Convert nibbles back to a byte array key.
 * Nibble count must be even.
 *
 * @param {Uint8Array} nibbles
 * @returns {Uint8Array}
 */
export function nibblesToKey(nibbles: Uint8Array): Uint8Array;
/**
 * Find the length of the common prefix between two nibble arrays.
 *
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {number}
 */
export function commonPrefixLength(a: Uint8Array, b: Uint8Array): number;
//# sourceMappingURL=nibbles.d.ts.map