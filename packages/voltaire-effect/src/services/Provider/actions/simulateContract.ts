/**
 * @fileoverview Simulates a contract write function and returns both the result and prepared request.
 *
 * @module Provider/actions/simulateContract
 * @since 0.0.1
 */

import {
	Address,
	BrandedAbi,
	type BrandedAddress,
	type BrandedHex,
	Hex,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import {
	type BlockTag,
	type CallError,
	type CallRequest,
	ProviderService,
	ProviderValidationError,
} from "../ProviderService.js";
import { call } from "../functions/call.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type Abi = readonly { type: string; name?: string }[];

/**
 * State override for eth_call simulation.
 * @since 0.0.1
 */
export interface StateOverride {
	readonly address: AddressType | `0x${string}`;
	readonly balance?: bigint;
	readonly nonce?: bigint;
	readonly code?: HexType | `0x${string}`;
	readonly stateDiff?: Record<`0x${string}`, `0x${string}`>;
}

/**
 * Parameters for simulateContract.
 * @since 0.0.1
 */
export interface SimulateContractParams<
	TAbi extends Abi,
	TFunctionName extends string,
> {
	readonly address: AddressType | `0x${string}`;
	readonly abi: TAbi;
	readonly functionName: TFunctionName;
	readonly args?: readonly unknown[];
	readonly account?: AddressType | `0x${string}`;
	readonly value?: bigint;
	readonly gas?: bigint;
	readonly gasPrice?: bigint;
	readonly maxFeePerGas?: bigint;
	readonly maxPriorityFeePerGas?: bigint;
	readonly blockTag?: BlockTag;
	readonly stateOverride?: readonly StateOverride[];
}

/**
 * Result from simulateContract including both decoded result and prepared request.
 * @since 0.0.1
 */
export interface SimulateContractResult<
	TAbi extends Abi,
	TFunctionName extends string,
> {
	readonly result: unknown;
	readonly request: {
		readonly address: AddressType;
		readonly abi: TAbi;
		readonly functionName: TFunctionName;
		readonly args: readonly unknown[];
		readonly to: AddressType;
		readonly data: HexType;
		readonly value?: bigint;
		readonly gas?: bigint;
	};
}

/**
 * Error union for simulateContract.
 */
export type SimulateContractError = CallError | ProviderValidationError;

/**
 * Simulates a contract write function without sending a transaction.
 *
 * Returns both the decoded result and a prepared transaction request
 * that can be used with a signer to send the actual transaction.
 *
 * @param params - The simulation parameters
 * @returns Effect yielding simulation result and prepared request
 *
 * @example
 * ```typescript
 * const { result, request } = yield* simulateContract({
 *   address: tokenAddress,
 *   abi: erc20Abi,
 *   functionName: 'transfer',
 *   args: [recipient, amount],
 *   account: senderAddress
 * })
 *
 * if (result === false) {
 *   throw new Error('Transfer would fail')
 * }
 *
 * const hash = yield* signer.sendTransaction({
 *   to: request.to,
 *   data: request.data,
 *   value: request.value
 * })
 * ```
 *
 * @since 0.0.1
 */
export const simulateContract = <
	TAbi extends Abi,
	TFunctionName extends string,
>(
	params: SimulateContractParams<TAbi, TFunctionName>,
): Effect.Effect<
	SimulateContractResult<TAbi, TFunctionName>,
	SimulateContractError,
	ProviderService
> =>
	Effect.gen(function* () {
		const addressHex =
			typeof params.address === "string"
				? params.address
				: Address.toHex(params.address);
		const brandedAddress =
			typeof params.address === "string"
				? Address.fromHex(params.address)
				: params.address;

		const data = BrandedAbi.encodeFunction(
			params.abi as unknown as BrandedAbi.Abi,
			params.functionName,
			params.args ?? [],
		);

		const callRequest: CallRequest = {
			to: addressHex,
			from: params.account,
			data,
			value: params.value,
			gas: params.gas,
		};

		const rawResult = yield* call(callRequest, params.blockTag);

		const fn = (params.abi as readonly { type: string; name?: string }[]).find(
			(item): item is BrandedAbi.Function.FunctionType =>
				item.type === "function" && (item as any).name === params.functionName,
		) as BrandedAbi.Function.FunctionType | undefined;

		if (!fn) {
			return yield* Effect.fail(
				new ProviderValidationError(
					{ functionName: params.functionName },
					`Function "${params.functionName}" not found in ABI`,
				),
			);
		}

		const bytes = Hex.toBytes(rawResult as `0x${string}`);
		const decoded = BrandedAbi.Function.decodeResult(fn, bytes);
		const result = fn.outputs.length === 1 ? decoded[0] : decoded;

		return {
			result,
			request: {
				address: brandedAddress,
				abi: params.abi,
				functionName: params.functionName,
				args: params.args ?? [],
				to: brandedAddress,
				data,
				value: params.value,
				gas: params.gas,
			},
		};
	});
