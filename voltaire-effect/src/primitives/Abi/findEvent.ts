/**
 * @fileoverview Finds an event in an ABI by name.
 * Provides Effect-based wrapper for looking up events.
 *
 * @module Abi/findEvent
 * @since 0.0.1
 */

import { type Event, Item, type ItemType } from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";

/**
 * Type alias for ABI input.
 * @internal
 */
type AbiInput = readonly ItemType[];

/**
 * Finds an event in an ABI by name.
 *
 * @description
 * Searches the ABI for an event with the given name.
 * Returns the event definition or undefined if not found.
 *
 * This is an infallible operation that always succeeds.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} name - The event name to find.
 * @returns {Effect.Effect<Event.EventType | undefined, never>}
 *   Effect yielding the event or undefined.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { findEvent } from 'voltaire-effect/primitives/Abi'
 *
 * const evt = Effect.runSync(findEvent(abi, 'Transfer'))
 * if (evt) {
 *   console.log(evt.inputs)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const findEvent = (
	abi: AbiInput,
	name: string,
): Effect.Effect<Event.EventType | undefined, never> =>
	Effect.sync(
		() => Item.getItem(abi, name, "event") as Event.EventType | undefined,
	);
