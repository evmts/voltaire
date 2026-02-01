/**
 * @fileoverview Check if value is a valid Hash.
 *
 * @module Hash/isHash
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";

/**
 * Check if value is a valid Hash.
 *
 * @description Type guard that checks if a value is a valid 32-byte hash.
 * This is a pure synchronous function that never fails.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is a valid HashType
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 *
 * if (Hash.isHash(value)) {
 *   // value is HashType
 * }
 * ```
 *
 * @since 0.0.1
 */
export const isHash = (value: unknown): value is HashType => Hash.isHash(value);
