/**
 * @fileoverview Convert Hash to hex string.
 *
 * @module Hash/toHex
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";

/**
 * Convert Hash to hex string.
 *
 * @description Converts a 32-byte hash to a 66-character hex string with 0x prefix.
 * This is a pure synchronous function that never fails.
 *
 * @param {HashType} hash - Hash to convert
 * @returns {string} Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 *
 * const hex = Hash.toHex(hash) // "0x..."
 * ```
 *
 * @since 0.0.1
 */
export const toHex = (hash: HashType): string => Hash.toHex(hash);
