/**
 * @fileoverview Get a slice of hash bytes.
 *
 * @module Hash/slice
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";

/**
 * Get a slice of hash bytes.
 *
 * @description Extracts a portion of the hash bytes. Uses standard slice semantics
 * (negative indices count from end). This is a pure synchronous function that never fails.
 *
 * @param {HashType} hash - Hash to slice
 * @param {number} [start] - Start index (inclusive)
 * @param {number} [end] - End index (exclusive)
 * @returns {Effect.Effect<Uint8Array>} Effect containing the sliced bytes
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * // Get first 4 bytes (function selector)
 * const selector = Effect.runSync(Hash.slice(hash, 0, 4))
 * ```
 *
 * @since 0.0.1
 */
export const slice = (
	hash: HashType,
	start?: number,
	end?: number,
): Effect.Effect<Uint8Array> => Effect.sync(() => Hash.slice(hash, start, end));
