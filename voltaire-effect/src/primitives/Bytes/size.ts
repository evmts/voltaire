/**
 * @fileoverview Bytes size retrieval.
 * @module size
 * @since 0.0.1
 */

import { type BytesType, Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";

/**
 * Gets the size of Bytes.
 *
 * @param bytes - Bytes to measure
 * @returns size in bytes
 *
 * @example
 * ```typescript
 * const len = Bytes.size(bytes) // 32
 * ```
 *
 * @since 0.0.1
 */
export const size = (bytes: BytesType): number => VoltaireBytes.size(bytes);
