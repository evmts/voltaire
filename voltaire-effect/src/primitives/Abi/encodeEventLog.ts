/**
 * @fileoverview Encodes event log topics.
 * Provides Effect-based wrapper for encoding event topics.
 *
 * @module Abi/encodeEventLog
 * @since 0.0.1
 */

import {
	type AbiEncodingError,
	Event as AbiEvent,
	AbiItemNotFoundError,
} from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Hex from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

/**
 * Represents a single ABI item.
 * @internal
 */
type AbiItem = { type: string; name?: string };

/**
 * Type alias for ABI input.
 * @internal
 */
type AbiInput = readonly AbiItem[];

/**
 * Encodes event log topics.
 *
 * @description
 * Encodes indexed event parameters as topics for filtering logs.
 * Returns the event selector as topic0 followed by encoded indexed parameters.
 * Null topics indicate a wildcard match in log filters.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} eventName - The event name.
 * @param {readonly unknown[]} indexedArgs - The indexed parameter values.
 * @returns {Effect.Effect<readonly (HexType | null)[], AbiItemNotFoundError | AbiEncodingError>}
 *   Effect yielding the encoded topics array.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeEventLog } from 'voltaire-effect/primitives/Abi'
 *
 * const topics = await Effect.runPromise(
 *   encodeEventLog(abi, 'Transfer', [from, to])
 * )
 * ```
 *
 * @since 0.0.1
 */
export const encodeEventLog = (
	abi: AbiInput,
	eventName: string,
	indexedArgs: readonly unknown[],
): Effect.Effect<
	readonly (HexType | null)[],
	AbiItemNotFoundError | AbiEncodingError
> =>
	Effect.try({
		try: () => {
			const evt = abi.find(
				(item) => item.type === "event" && item.name === eventName,
			);
			if (!evt) {
				throw new AbiItemNotFoundError(
					`Event "${eventName}" not found in ABI`,
					{
						value: eventName,
						expected: "valid event name in ABI",
						context: { eventName, abi },
					},
				);
			}
			const topics = AbiEvent.encodeTopics(
				evt as AbiEvent.EventType,
				indexedArgs as never,
			);
			return topics.map((t) => (t ? Hex.fromBytes(t as Uint8Array) : null));
		},
		catch: (e) => e as AbiItemNotFoundError | AbiEncodingError,
	});
