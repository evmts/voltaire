/**
 * @fileoverview Formats ABI item as human-readable string.
 * Provides Effect-based wrapper for ABI formatting.
 *
 * @module Abi/format
 * @since 0.0.1
 */

import { Item } from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

/**
 * Formats an ABI item as a human-readable string.
 *
 * @description
 * Converts an ABI item to its canonical human-readable representation,
 * e.g., "function transfer(address to, uint256 amount) returns (bool)".
 *
 * This is an infallible operation that always succeeds.
 *
 * @param {object} item - The ABI item to format.
 * @returns {Effect.Effect<string, never>}
 *   Effect yielding the formatted string.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { format } from 'voltaire-effect/primitives/Abi'
 *
 * const fn = { type: 'function', name: 'transfer', inputs: [...], outputs: [...] }
 * const formatted = Effect.runSync(format(fn))
 * // 'function transfer(address to, uint256 amount) returns (bool)'
 * ```
 *
 * @since 0.0.1
 */
export const format = (
	item: Parameters<typeof Item.format>[0],
): Effect.Effect<string, never> => Effect.sync(() => Item.format(item));
