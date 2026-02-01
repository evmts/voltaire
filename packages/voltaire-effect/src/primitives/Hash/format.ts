/**
 * @fileoverview Format hash for display.
 *
 * @module Hash/format
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";

/**
 * Format hash for display (truncated).
 *
 * @description Returns a truncated hex string like "0x1234...5678".
 * This is a pure synchronous function that never fails.
 *
 * @param {HashType} hash - Hash to format
 * @param {number} [prefixLength=6] - Number of chars to show at start
 * @param {number} [suffixLength=4] - Number of chars to show at end
 * @returns {Effect.Effect<string>} Effect containing formatted string
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const display = Effect.runSync(Hash.format(hash)) // "0x1234...5678"
 * ```
 *
 * @since 0.0.1
 */
export const format = (
	hash: HashType,
	prefixLength = 6,
	suffixLength = 4,
): Effect.Effect<string> =>
	Effect.sync(() => Hash.format(hash, prefixLength, suffixLength));
