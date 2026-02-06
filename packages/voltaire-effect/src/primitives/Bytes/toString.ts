/**
 * @fileoverview Bytes to UTF-8 string conversion.
 * @module toString
 * @since 0.0.1
 */

import { type BytesType, Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";

/**
 * Converts Bytes to UTF-8 string.
 *
 * @param bytes - The bytes to decode
 * @returns UTF-8 string
 *
 * @example
 * ```typescript
 * const str = Bytes.toString(bytes) // "hello"
 * ```
 *
 * @since 0.0.1
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional API name
export const toString = (bytes: BytesType): string =>
	VoltaireBytes.toString(bytes);
