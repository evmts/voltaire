/**
 * @fileoverview Multicall aggregate3 helper for batching contract reads.
 *
 * @module Multicall
 * @since 0.0.1
 *
 * @description
 * Provides a low-level multicall function for batching multiple contract reads
 * into a single RPC call using the Multicall3 contract. This helper depends on
 * TransportService (no dedicated Multicall service layer required).
 *
 * @see {@link TransportService} - Required for JSON-RPC calls
 */

import { decodeParameters, encodeParameters } from "@tevm/voltaire/Abi";
import * as Hex from "@tevm/voltaire/Hex";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import type { BlockTag } from "../Provider/ProviderService.js";
import { TransportService } from "../Transport/TransportService.js";

/**
 * Represents a single call to be batched in a multicall.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const call: MulticallCall = {
 *   target: '0x1234...',
 *   callData: '0xa9059cbb...', // encoded function call
 *   allowFailure: true
 * }
 * ```
 */
export interface MulticallCall {
	/** Target contract address to call */
	readonly target: `0x${string}`;
	/** ABI-encoded function call data */
	readonly callData: `0x${string}`;
	/** Whether this call is allowed to fail without reverting the batch */
	readonly allowFailure?: boolean;
}

/**
 * Result of a single call in a multicall batch.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const result: MulticallResult = {
 *   success: true,
 *   returnData: '0x000000000000000000000000000000000000000000000000000000000000001e'
 * }
 * ```
 */
export interface MulticallResult {
	/** Whether the call succeeded */
	readonly success: boolean;
	/** The return data from the call (empty if failed) */
	readonly returnData: `0x${string}`;
}

/**
 * Error thrown when a multicall operation fails.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const error = new MulticallError({
 *   message: 'Multicall failed: contract reverted',
 *   failedCalls: [1, 3],
 *   cause: originalError
 * })
 * ```
 */
export class MulticallError extends Data.TaggedError("MulticallError")<{
	/** Human-readable error message */
	readonly message: string;
	/** Indices of calls that failed (if applicable) */
	readonly failedCalls?: readonly number[];
	/** Underlying error that caused the failure */
	readonly cause?: unknown;
}> {}

/**
 * Standard Multicall3 contract address.
 * Deployed at this address on Ethereum mainnet and most EVM chains.
 */
export const MULTICALL3_ADDRESS =
	"0xcA11bde05977b3631167028862bE2a173976CA11" as const;

/**
 * Function selector for aggregate3(Call3[] calldata calls).
 * keccak256("aggregate3((address,bool,bytes)[])") = 0x82ad56cb
 */
const AGGREGATE3_SELECTOR = "0x82ad56cb" as const;

/**
 * ABI parameter definitions for encoding aggregate3 calls.
 */
const AGGREGATE3_INPUT_PARAMS = [
	{
		type: "tuple[]" as const,
		name: "calls",
		components: [
			{ type: "address" as const, name: "target" },
			{ type: "bool" as const, name: "allowFailure" },
			{ type: "bytes" as const, name: "callData" },
		],
	},
];

/**
 * ABI parameter definitions for decoding aggregate3 results.
 */
const AGGREGATE3_OUTPUT_PARAMS = [
	{
		type: "tuple[]" as const,
		name: "returnData",
		components: [
			{ type: "bool" as const, name: "success" },
			{ type: "bytes" as const, name: "returnData" },
		],
	},
];

/**
 * Encodes calls for aggregate3.
 */
const encodeAggregate3 = (calls: readonly MulticallCall[]): `0x${string}` => {
	const tuples = calls.map((call) => ({
		target: call.target,
		allowFailure: call.allowFailure ?? false,
		callData: call.callData,
	}));

	// biome-ignore lint/suspicious/noExplicitAny: ABI encoding requires dynamic type casting
	const encoded = encodeParameters(
		AGGREGATE3_INPUT_PARAMS as any,
		[tuples] as any,
	);

	const encodedHex = Hex.fromBytes(encoded);
	return `${AGGREGATE3_SELECTOR}${encodedHex.slice(2)}` as `0x${string}`;
};

/**
 * Decodes aggregate3 return data.
 */
const decodeAggregate3 = (data: `0x${string}`): readonly MulticallResult[] => {
	const bytes = Hex.toBytes(data);
	// biome-ignore lint/suspicious/noExplicitAny: ABI decoding requires dynamic type casting
	const decoded = decodeParameters(AGGREGATE3_OUTPUT_PARAMS as any, bytes);

	const results = decoded[0] as readonly {
		success: boolean;
		returnData: Uint8Array | `0x${string}`;
	}[];

	return results.map((result) => ({
		success: result.success,
		returnData:
			typeof result.returnData === "string"
				? result.returnData
				: Hex.fromBytes(result.returnData),
	}));
};

/**
 * Executes multiple calls in a single RPC request using Multicall3 aggregate3.
 *
 * @param calls - Array of calls to execute
 * @param blockTag - Optional block tag to execute the call against
 * @param multicallAddress - Optional Multicall3 address override
 * @returns Array of results in the same order as input calls
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { aggregate3, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   return yield* aggregate3([
 *     { target: '0x...', callData: '0x...' },
 *     { target: '0x...', callData: '0x...' }
 *   ])
 * }).pipe(
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 */
export const aggregate3 = (
	calls: readonly MulticallCall[],
	blockTag?: BlockTag,
	multicallAddress: `0x${string}` = MULTICALL3_ADDRESS,
): Effect.Effect<readonly MulticallResult[], MulticallError, TransportService> =>
	Effect.gen(function* () {
		if (calls.length === 0) {
			return [] as readonly MulticallResult[];
		}

		const transport = yield* TransportService;
		const callData = encodeAggregate3(calls);
		const tag = blockTag ?? "latest";

		const result = yield* transport
			.request<`0x${string}`>("eth_call", [
				{ to: multicallAddress, data: callData },
				tag,
			])
			.pipe(
				Effect.mapError(
					(e) =>
						new MulticallError({
							message: `Multicall3 call failed: ${e.message}`,
							cause: e,
						}),
				),
			);

		try {
			return decodeAggregate3(result as `0x${string}`);
		} catch (e) {
			return yield* Effect.fail(
				new MulticallError({
					message: `Failed to decode multicall result: ${e instanceof Error ? e.message : String(e)}`,
					cause: e,
				}),
			);
		}
	});
