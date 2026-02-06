/**
 * @fileoverview Bytes concatenation.
 * @module concat
 * @since 0.0.1
 */

import { type BytesType, Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";

/**
 * Concatenates multiple Bytes.
 *
 * @param arrays - Bytes to concatenate
 * @returns concatenated BytesType
 *
 * @example
 * ```typescript
 * const result = Bytes.concat(bytes1, bytes2, bytes3)
 * ```
 *
 * @since 0.0.1
 */
export const concat = (...arrays: BytesType[]): BytesType =>
	VoltaireBytes.concat(...arrays);
