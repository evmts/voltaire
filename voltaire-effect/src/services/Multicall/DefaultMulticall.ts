/**
 * @fileoverview Live implementation of MulticallService using Multicall3.
 *
 * @module DefaultMulticall
 * @since 0.0.1
 *
 * @description
 * Provides the live implementation layer for MulticallService. This layer
 * uses the Multicall3 contract to batch multiple calls into a single RPC request.
 *
 * The Multicall3 contract is deployed at the same address (0xcA11bde05977b3631167028862bE2a173976CA11)
 * on most EVM-compatible chains.
 *
 * @see {@link MulticallService} - The service interface
 * @see {@link ProviderService} - Required for making the eth_call
 */

import { decodeParameters, encodeParameters } from "@tevm/voltaire/Abi";
import * as Hex from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { type BlockTag, ProviderService } from "../Provider/ProviderService.js";
import {
	type MulticallCall,
	MulticallError,
	type MulticallResult,
	MulticallService,
} from "./MulticallService.js";

/**
 * Standard Multicall3 contract address.
 * Deployed at this address on Ethereum mainnet and most EVM chains.
 */
const MULTICALL3_ADDRESS =
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
 * Live implementation of the multicall layer.
 *
 * @description
 * Provides a concrete implementation of MulticallService that uses
 * the Multicall3 contract to batch calls.
 *
 * Requires ProviderService in context for making eth_call requests.
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { DefaultMulticall, MulticallService, Provider, HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const multicall = yield* MulticallService
 *   return yield* multicall.aggregate3([
 *     { target: '0x...', callData: '0x...' }
 *   ])
 * }).pipe(
 *   Effect.provide(DefaultMulticall),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @example With custom multicall address
 * ```typescript
 * // For chains with Multicall3 at a different address,
 * // you can create a custom layer
 * const CustomMulticall = Layer.effect(
 *   MulticallService,
 *   Effect.gen(function* () {
 *     const provider = yield* ProviderService
 *     // ... implementation with custom address
 *   })
 * )
 * ```
 *
 * @see {@link MulticallService} - The service interface
 * @see {@link ProviderService} - Required provider dependency
 */
export const DefaultMulticall: Layer.Layer<
	MulticallService,
	never,
	ProviderService
> = Layer.effect(
	MulticallService,
	Effect.gen(function* () {
		const provider = yield* ProviderService;

		return {
			aggregate3: (calls: readonly MulticallCall[], blockTag?: BlockTag) =>
				Effect.gen(function* () {
					if (calls.length === 0) {
						return [] as readonly MulticallResult[];
					}

					const callData = encodeAggregate3(calls);

					const result = yield* provider
						.call(
							{
								to: MULTICALL3_ADDRESS,
								data: callData,
							},
							blockTag,
						)
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
				}),
		};
	}),
);
