/**
 * @fileoverview Formats ABI item with argument values.
 * Provides Effect-based wrapper for ABI formatting with args.
 *
 * @module Abi/formatWithArgs
 * @since 0.0.1
 */

import { Item } from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

/**
 * Formats an ABI item with argument values.
 *
 * @description
 * Converts an ABI item to its human-readable representation with
 * actual argument values substituted, e.g.,
 * "function transfer(0x123..., 1000)".
 *
 * This is an infallible operation that always succeeds.
 *
 * @param {object} item - The ABI item to format.
 * @param {readonly unknown[]} args - The argument values.
 * @returns {Effect.Effect<string, never>}
 *   Effect yielding the formatted string with args.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { formatWithArgs } from 'voltaire-effect/primitives/Abi'
 *
 * const fn = { type: 'function', name: 'transfer', inputs: [...] }
 * const formatted = Effect.runSync(formatWithArgs(fn, ['0x123...', 1000n]))
 * // 'function transfer(0x123..., 1000)'
 * ```
 *
 * @since 0.0.1
 */
export const formatWithArgs = (
	item: Parameters<typeof Item.formatWithArgs>[0],
	args: readonly unknown[],
): Effect.Effect<string, never> =>
	Effect.sync(() => Item.formatWithArgs(item, args as never));
