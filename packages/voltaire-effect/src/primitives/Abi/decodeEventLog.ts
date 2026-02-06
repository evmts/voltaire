/**
 * @fileoverview Decodes Ethereum event logs using ABI definitions.
 * Provides Effect-based wrapper for decoding log data and topics into
 * structured event information with typed parameters.
 *
 * @module Abi/decodeEventLog
 * @since 0.0.1
 */

import {
	type Abi,
	type AbiDecodingError,
	AbiDecodingError as AbiDecodingErrorClass,
	type AbiItemNotFoundError,
	decodeLog,
	type ItemType,
} from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

type AbiErrorType = AbiItemNotFoundError | AbiDecodingError;

const isAbiError = (e: unknown): e is AbiErrorType =>
	e !== null &&
	typeof e === "object" &&
	"name" in e &&
	(e.name === "AbiItemNotFoundError" || e.name === "AbiDecodingError");

/**
 * Type alias for ABI input accepted by the decoder.
 * @internal
 */
type AbiInput = readonly ItemType[];

/**
 * Internal helper to cast AbiInput to Abi.
 * @internal
 */
const toAbi = (input: AbiInput): Abi => input as unknown as Abi;

/**
 * Input structure for decoding event logs.
 * Represents the raw log data emitted during transaction execution.
 *
 * @description
 * Contains the log data payload and topics array from an Ethereum event.
 * The first topic (topics[0]) is typically the event signature hash,
 * while subsequent topics contain indexed event parameters.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const log: LogInput = {
 *   data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer signature
 *     '0x000000000000000000000000sender...',  // indexed from
 *     '0x000000000000000000000000recipient...' // indexed to
 *   ]
 * }
 * ```
 */
export interface LogInput {
	/**
	 * The log data as hex string or bytes.
	 * Contains non-indexed event parameters ABI-encoded.
	 */
	data: HexType | Uint8Array;
	/**
	 * Array of log topics as hex strings or bytes.
	 * First topic is event signature, rest are indexed params.
	 */
	topics: readonly (HexType | Uint8Array)[];
}

/**
 * Decodes an event log using the provided ABI.
 *
 * @description
 * Parses raw log data and topics into a structured object containing
 * the event name and decoded parameters. Uses the first topic to identify
 * the event by its signature hash, then decodes remaining topics and data
 * according to the event's ABI definition.
 *
 * This function never throws exceptions. Instead, it returns an Effect
 * that may fail with an `AbiItemNotFoundError` if no matching event
 * is found in the provided ABI, or an `AbiDecodingError` if the log
 * data cannot be decoded.
 *
 * @param {AbiInput} abi - The contract ABI containing event definitions.
 *   Can be a JSON ABI array or parsed ABI object.
 * @param {LogInput} log - The log data with topics to decode.
 *   Must include at least one topic (the event signature).
 *
 * @returns {Effect.Effect<{ event: string; params: Record<string, unknown> }, AbiItemNotFoundError | AbiDecodingError>}
 *   Effect yielding an object with:
 *   - `event`: The name of the matched event
 *   - `params`: Record of parameter names to decoded values
 *   Or failing with `AbiItemNotFoundError` if event not found.
 *
 * @throws {AbiItemNotFoundError} When no event in the ABI matches the log's topic signature.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeEventLog } from 'voltaire-effect/primitives/Abi'
 *
 * const erc20Abi = [
 *   {
 *     type: 'event',
 *     name: 'Transfer',
 *     inputs: [
 *       { name: 'from', type: 'address', indexed: true },
 *       { name: 'to', type: 'address', indexed: true },
 *       { name: 'value', type: 'uint256', indexed: false }
 *     ]
 *   }
 * ]
 *
 * const result = await Effect.runPromise(decodeEventLog(erc20Abi, {
 *   data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
 *   topics: [
 *     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
 *     '0x000000000000000000000000abc...',
 *     '0x000000000000000000000000def...'
 *   ]
 * }))
 *
 * console.log(result.event) // 'Transfer'
 * console.log(result.params) // { from: '0xabc...', to: '0xdef...', value: 1000000000000000000n }
 * ```
 *
 * @example
 * ```typescript
 * // Handle unknown events gracefully
 * const decoded = await Effect.runPromise(
 *   decodeEventLog(abi, log).pipe(
 *     Effect.catchTag('AbiItemNotFoundError', (e) =>
 *       Effect.succeed({ event: 'Unknown', params: {} })
 *     )
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 * @see {@link getEvent} for retrieving event definitions by name
 */
export const decodeEventLog = (
	abi: AbiInput,
	log: LogInput,
): Effect.Effect<
	{ event: string; params: Record<string, unknown> },
	AbiItemNotFoundError | AbiDecodingError
> =>
	Effect.try({
		try: () => decodeLog(toAbi(abi), log),
		catch: (e) =>
			isAbiError(e)
				? e
				: new AbiDecodingErrorClass("Failed to decode event log", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
