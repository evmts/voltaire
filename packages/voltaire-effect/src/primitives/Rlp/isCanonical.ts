import { Rlp as VoltaireRlp } from "@tevm/voltaire/Rlp";

/**
 * Validates if RLP encoding is canonical.
 *
 * Canonical encoding rules:
 * - Integers must use minimum bytes (no leading zeros)
 * - Strings/bytes must use shortest length prefix
 * - Single byte < 0x80 must not be encoded as string
 * - Length prefix must use minimum bytes
 *
 * @param bytes - RLP-encoded data
 * @param depth - Current recursion depth (internal)
 * @returns True if encoding is canonical
 *
 * @example
 * ```typescript
 * import { isCanonical } from 'voltaire-effect/primitives/Rlp'
 *
 * // Canonical encoding
 * const canonical = new Uint8Array([0x83, 0x64, 0x6f, 0x67]) // "dog"
 * isCanonical(canonical) // => true
 *
 * // Non-canonical: single byte should not be prefixed
 * const nonCanonical = new Uint8Array([0x81, 0x7f]) // should be just 0x7f
 * isCanonical(nonCanonical) // => false
 * ```
 *
 * @since 0.0.1
 */
export const isCanonical = (bytes: Uint8Array, depth?: number): boolean =>
	VoltaireRlp.isCanonical(bytes, depth);
