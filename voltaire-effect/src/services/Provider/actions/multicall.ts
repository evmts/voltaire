/**
 * @fileoverview Multicall action for batching multiple contract reads.
 *
 * @module Provider/actions/multicall
 * @since 0.0.1
 */

import {
	Address,
	BrandedAbi,
	type Abi as BrandedAbiType,
	type BrandedAddress,
	type BrandedHex,
	Hex,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import {
	type AddressInput,
	type BlockTag,
	type CallError,
	ProviderResponseError,
	ProviderService,
	ProviderValidationError,
} from "../ProviderService.js";
import type { Abi } from "./readContract.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;

/**
 * Extracts function names from an ABI.
 */
type ExtractFunctionNames<TAbi extends Abi> =
	TAbi extends readonly (infer Item)[]
		? Item extends { type: "function"; name: infer Name }
			? Name extends string
				? Name
				: never
			: never
		: never;

/**
 * Gets the inputs for a specific function from an ABI.
 */
type GetFunctionInputs<
	TAbi extends Abi,
	TFunctionName extends string,
> = TAbi extends readonly (infer Item)[]
	? Item extends { type: "function"; name: TFunctionName; inputs: infer Inputs }
		? Inputs extends readonly { type: string }[]
			? AbiInputsToArgs<Inputs>
			: readonly unknown[]
		: readonly unknown[]
	: readonly unknown[];

/**
 * Maps ABI input types to TypeScript types.
 */
type AbiInputsToArgs<TInputs extends readonly { type: string }[]> = {
	[K in keyof TInputs]: AbiTypeToTS<TInputs[K]["type"]>;
};

/**
 * Maps a single ABI type to TypeScript type.
 */
type AbiTypeToTS<T extends string> = T extends `uint${string}` | `int${string}`
	? bigint
	: T extends "address"
		? AddressType | `0x${string}`
		: T extends "bool"
			? boolean
			: T extends `bytes${string}`
				? HexType | `0x${string}`
				: T extends "string"
					? string
					: T extends `${string}[]`
						? readonly unknown[]
						: T extends `(${string})`
							? readonly unknown[]
							: unknown;

/**
 * Gets the output type for a specific function from an ABI.
 */
type GetFunctionOutput<
	TAbi extends Abi,
	TFunctionName extends string,
> = TAbi extends readonly (infer Item)[]
	? Item extends {
			type: "function";
			name: TFunctionName;
			outputs: infer Outputs;
		}
		? Outputs extends readonly { type: string }[]
			? Outputs["length"] extends 0
				? undefined
				: Outputs["length"] extends 1
					? AbiTypeToTS<Outputs[0]["type"]>
					: {
							[K in keyof Outputs]: AbiTypeToTS<
								Outputs[K] extends { type: string } ? Outputs[K]["type"] : never
							>;
						}
			: unknown
		: unknown
	: unknown;

/**
 * Represents a contract call to be batched in multicall.
 */
export interface ContractCall<
	TAbi extends Abi = Abi,
	TFunctionName extends ExtractFunctionNames<TAbi> &
		string = ExtractFunctionNames<TAbi> & string,
> {
	readonly address: AddressInput;
	readonly abi: TAbi;
	readonly functionName: TFunctionName;
	readonly args?: GetFunctionInputs<TAbi, TFunctionName>;
}

export interface MulticallParams<TContracts extends readonly ContractCall[]> {
	readonly contracts: TContracts;
	readonly allowFailure?: boolean;
	readonly blockTag?: BlockTag;
	readonly batchSize?: number;
}

type ContractCallResult<TContract extends ContractCall> =
	TContract extends ContractCall<infer TAbi, infer TFunctionName>
		? GetFunctionOutput<TAbi, TFunctionName>
		: unknown;

export type MulticallResults<
	TContracts extends readonly ContractCall[],
	TAllowFailure extends boolean = true,
> = {
	[Index in keyof TContracts]: TAllowFailure extends true
		? ContractCallResult<TContracts[Index]> | null
		: ContractCallResult<TContracts[Index]>;
};

/**
 * Error union for multicall.
 */
export type MulticallError =
	| CallError
	| ProviderResponseError
	| ProviderValidationError;

const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

const MULTICALL3_ABI = [
	{
		name: "aggregate3",
		type: "function",
		stateMutability: "view",
		inputs: [
			{
				name: "calls",
				type: "tuple[]",
				components: [
					{ name: "target", type: "address" },
					{ name: "allowFailure", type: "bool" },
					{ name: "callData", type: "bytes" },
				],
			},
		],
		outputs: [
			{
				name: "results",
				type: "tuple[]",
				components: [
					{ name: "success", type: "bool" },
					{ name: "returnData", type: "bytes" },
				],
			},
		],
	},
] as const;

const AGGREGATE3_FN =
	MULTICALL3_ABI[0] as unknown as BrandedAbi.Function.FunctionType;

type Aggregate3Result = {
	success: boolean;
	returnData: Uint8Array | `0x${string}`;
};

const decodeAggregate3 = (data: `0x${string}`): Aggregate3Result[] => {
	const decoded = BrandedAbi.Function.decodeResult(
		AGGREGATE3_FN,
		Hex.toBytes(data),
	);
	const output = AGGREGATE3_FN.outputs.length === 1 ? decoded[0] : decoded;
	return output as Aggregate3Result[];
};

const normalizeBatchSize = (count: number, batchSize?: number): number => {
	if (batchSize === undefined || batchSize <= 0 || Number.isNaN(batchSize)) {
		return count;
	}
	return Math.floor(batchSize);
};

const normalizeAddress = (address: AddressInput): `0x${string}` =>
	typeof address === "string" ? address : Address.toHex(address);

export const multicall = <TContracts extends readonly ContractCall[]>(
	params: MulticallParams<TContracts>,
): Effect.Effect<
	MulticallResults<TContracts>,
	MulticallError,
	ProviderService
> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		const allowFailure = params.allowFailure ?? true;

		if (params.contracts.length === 0) {
			return [] as MulticallResults<TContracts>;
		}

		const batchSize = normalizeBatchSize(
			params.contracts.length,
			params.batchSize,
		);
		const results: unknown[] = [];

		for (let start = 0; start < params.contracts.length; start += batchSize) {
			const batch = params.contracts.slice(start, start + batchSize);
			const calls = batch.map((contract) => ({
				target: normalizeAddress(contract.address),
				allowFailure,
				callData: BrandedAbi.encodeFunction(
					contract.abi as unknown as BrandedAbiType,
					contract.functionName,
					(contract.args ?? []) as unknown[],
				),
			}));

			const data = BrandedAbi.encodeFunction(
				MULTICALL3_ABI as unknown as BrandedAbiType,
				"aggregate3",
				[calls],
			);

			const result = yield* provider.call(
				{ to: MULTICALL3_ADDRESS, data },
				params.blockTag,
			);

			const decoded = decodeAggregate3(result as `0x${string}`);

			for (let index = 0; index < decoded.length; index++) {
				const entry = decoded[index];
				if (!entry.success) {
					if (!allowFailure) {
						return yield* Effect.fail(
							new ProviderResponseError(
								{
									batch: start,
									index: start + index,
									blockTag: params.blockTag,
								},
								`Call ${start + index} failed`,
							),
						);
					}
					results.push(null);
					continue;
				}

				const contract = batch[index];
				const fn = (
					contract.abi as readonly { type: string; name?: string }[]
				).find(
					(item) =>
						item.type === "function" && item.name === contract.functionName,
				) as BrandedAbi.Function.FunctionType | undefined;

				if (!fn) {
					return yield* Effect.fail(
						new ProviderValidationError(
							{ functionName: contract.functionName },
							`Function "${contract.functionName}" not found in ABI`,
						),
					);
				}

				const bytes =
					typeof entry.returnData === "string"
						? Hex.toBytes(entry.returnData)
						: entry.returnData;
				const decodedResult = BrandedAbi.Function.decodeResult(fn, bytes);
				const value =
					fn.outputs.length === 1 ? decodedResult[0] : decodedResult;

				results.push(value);
			}
		}

		return results as MulticallResults<TContracts>;
	});
