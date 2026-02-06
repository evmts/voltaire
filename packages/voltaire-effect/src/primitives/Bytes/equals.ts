/**
 * @fileoverview Bytes equality check.
 * @module equals
 * @since 0.0.1
 */

import { type BytesType, Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";

/**
 * Checks if two Bytes are equal.
 *
 * WARNING: Not constant-time. Do NOT use for cryptographic comparisons.
 *
 * @param a - First bytes
 * @param b - Second bytes
 * @returns true if bytes are equal
 *
 * @example
 * ```typescript
 * const areEqual = Bytes.equals(bytes1, bytes2) // true or false
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: BytesType, b: BytesType): boolean =>
	VoltaireBytes.equals(a, b);
