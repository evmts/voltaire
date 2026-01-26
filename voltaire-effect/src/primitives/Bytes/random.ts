/**
 * @fileoverview Random Bytes generation.
 * @module random
 * @since 0.0.1
 */

import { type BytesType, Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";

/**
 * Generates random Bytes of specified size.
 *
 * @param size - Number of random bytes to generate
 * @returns random BytesType
 *
 * @example
 * ```typescript
 * const random32 = Bytes.random(32)
 * ```
 *
 * @since 0.0.1
 */
export const random = (size: number): BytesType => VoltaireBytes.random(size);
