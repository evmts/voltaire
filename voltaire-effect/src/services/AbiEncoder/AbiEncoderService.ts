/**
 * @fileoverview ABI encoding/decoding service definition.
 *
 * @module AbiEncoderService
 * @since 0.0.1
 *
 * @description
 * Provides Effect-based ABI encoding and decoding operations for:
 * - Function call encoding/decoding
 * - Event topic encoding
 * - Event log decoding
 *
 * All operations are wrapped in Effect for proper error handling.
 *
 * @see {@link DefaultAbiEncoder} - The live implementation layer
 */

import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";

/**
 * Error thrown when ABI encoding fails.
 *
 * @since 0.0.1
 */
export class AbiEncodeError extends Data.TaggedError("AbiEncodeError")<{
	readonly functionName: string;
	readonly args: readonly unknown[];
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when ABI decoding fails.
 *
 * @since 0.0.1
 */
export class AbiDecodeError extends Data.TaggedError("AbiDecodeError")<{
	readonly data: `0x${string}`;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Shape of the ABI encoder service.
 *
 * @since 0.0.1
 */
export type AbiEncoderShape = {
	/**
	 * Encodes a function call with the given arguments.
	 *
	 * @param abi - The contract ABI
	 * @param functionName - The function name to encode
	 * @param args - The arguments to encode
	 * @returns Encoded calldata as hex
	 */
	readonly encodeFunction: (
		abi: readonly unknown[],
		functionName: string,
		args: readonly unknown[],
	) => Effect.Effect<`0x${string}`, AbiEncodeError>;

	/**
	 * Decodes function return data.
	 *
	 * @param abi - The contract ABI
	 * @param functionName - The function name that was called
	 * @param data - The raw return data
	 * @returns Decoded result values
	 */
	readonly decodeFunction: (
		abi: readonly unknown[],
		functionName: string,
		data: `0x${string}`,
	) => Effect.Effect<readonly unknown[], AbiDecodeError>;

	/**
	 * Encodes event topics for filtering logs.
	 *
	 * @param abi - The contract ABI
	 * @param eventName - The event name
	 * @param args - Optional indexed argument values for filtering
	 * @returns Array of topic hashes
	 */
	readonly encodeEventTopics: (
		abi: readonly unknown[],
		eventName: string,
		args?: readonly unknown[],
	) => Effect.Effect<readonly `0x${string}`[], AbiEncodeError>;

	/**
	 * Decodes an event log into structured data.
	 *
	 * @param abi - The contract ABI
	 * @param eventName - The event name
	 * @param data - The log data
	 * @param topics - The log topics
	 * @returns Decoded event arguments as a record
	 */
	readonly decodeEventLog: (
		abi: readonly unknown[],
		eventName: string,
		data: `0x${string}`,
		topics: readonly `0x${string}`[],
	) => Effect.Effect<Record<string, unknown>, AbiDecodeError>;
};

/**
 * ABI encoding/decoding service.
 *
 * @description
 * Provides methods for encoding function calls, decoding return data,
 * and working with event logs. All operations return Effects that may
 * fail with AbiEncodeError or AbiDecodeError.
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { AbiEncoderService, DefaultAbiEncoder } from 'voltaire-effect/services'
 *
 * const abi = [
 *   { type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }
 * ] as const
 *
 * const program = Effect.gen(function* () {
 *   const encoder = yield* AbiEncoderService
 *   const calldata = yield* encoder.encodeFunction(abi, 'balanceOf', ['0x1234...'])
 *   return calldata
 * }).pipe(
 *   Effect.provide(DefaultAbiEncoder)
 * )
 * ```
 */
export class AbiEncoderService extends Context.Tag("AbiEncoderService")<
	AbiEncoderService,
	AbiEncoderShape
>() {}
