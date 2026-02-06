/**
 * Validates if RLP encoding is canonical
 *
 * Canonical encoding rules:
 * - Integers must use minimum bytes (no leading zeros)
 * - Strings/bytes must use shortest length prefix
 * - Single byte < 0x80 must not be encoded as string
 * - Length prefix must use minimum bytes
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @see https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/ for canonical rules
 * @since 0.0.0
 * @param {Uint8Array} bytes - RLP-encoded data
 * @param {number} [depth=0] - Current recursion depth (internal)
 * @returns {boolean} True if encoding is canonical
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * // Canonical encoding
 * const canonical = new Uint8Array([0x83, 0x64, 0x6f, 0x67]); // "dog"
 * Rlp.isCanonical(canonical); // => true
 *
 * // Non-canonical: single byte should not be prefixed
 * const nonCanonical = new Uint8Array([0x81, 0x7f]); // should be just 0x7f
 * Rlp.isCanonical(nonCanonical); // => false
 *
 * // Non-canonical: leading zeros in length
 * const leadingZeros = new Uint8Array([0xb8, 0x00, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
 * Rlp.isCanonical(leadingZeros); // => false
 * ```
 */
export function isCanonical(bytes: Uint8Array, depth?: number): boolean;
//# sourceMappingURL=isCanonical.d.ts.map