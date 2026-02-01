/**
 * @fileoverview Decodes event log data using ABI.
 * Provides Effect-based wrapper for parsing log entries.
 *
 * @module Abi/decodeLog
 * @since 0.0.1
 */

import {
	type Abi,
	AbiDecodingError as AbiDecodingErrorClass,
	type AbiDecodingError,
	type AbiItemNotFoundError,
	type ItemType,
	decodeLog as _decodeLog,
} from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

type AbiInput = readonly ItemType[];

const toAbi = (input: AbiInput): Abi => input as unknown as Abi;

type DecodeLogErrorType = AbiItemNotFoundError | AbiDecodingError;

const isAbiError = (e: unknown): e is DecodeLogErrorType =>
	e !== null &&
	typeof e === "object" &&
	"name" in e &&
	(e.name === "AbiItemNotFoundError" || e.name === "AbiDecodingError");

/**
 * Log input structure.
 */
export interface LogInput {
	data: HexType | Uint8Array;
	topics: readonly (HexType | Uint8Array)[];
}

/**
 * Decodes event log data using ABI.
 *
 * @description
 * Parses a log entry to extract the event name and decoded parameters.
 * Supports both regular events (matched by topic0) and anonymous events.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {LogInput} log - The log object with data and topics.
 * @returns {Effect.Effect<{ event: string; params: Record<string, unknown> }, AbiItemNotFoundError | AbiDecodingError>}
 *   Effect yielding the event name and decoded parameters.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeLog } from 'voltaire-effect/primitives/Abi'
 *
 * const decoded = await Effect.runPromise(
 *   decodeLog(abi, { data: '0x...', topics: ['0x...', ...] })
 * )
 * console.log(decoded.event) // 'Transfer'
 * console.log(decoded.params) // { from: '0x...', to: '0x...', value: 100n }
 * ```
 *
 * @since 0.0.1
 */
export const decodeLog = (
	abi: AbiInput,
	log: LogInput,
): Effect.Effect<
	{ event: string; params: Record<string, unknown> },
	AbiItemNotFoundError | AbiDecodingError
> =>
	Effect.try({
		try: () => _decodeLog(toAbi(abi), log),
		catch: (e) =>
			isAbiError(e)
				? e
				: new AbiDecodingErrorClass("Failed to decode log", {
						cause: e instanceof Error ? e : undefined,
					}),
	});
