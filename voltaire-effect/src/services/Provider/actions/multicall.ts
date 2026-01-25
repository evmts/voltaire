/**
 * @fileoverview Multicall action for batching multiple contract reads.
 *
 * @module Provider/actions/multicall
 * @since 0.0.1
 */

import {
	type Abi as BrandedAbiType,
	BrandedAbi,
	Hex,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import {
	type BlockTag,
	ProviderError,
	ProviderService,
} from "../ProviderService.js";

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
				name: "returnData",
				type: "tuple[]",
				components: [
					{ name: "success", type: "bool" },
					{ name: "returnData", type: "bytes" },
				],
			},
		],
	},
] as const;

export interface MulticallContract {
	readonly address: string;
	readonly abi: readonly unknown[];
	readonly functionName: string;
	readonly args?: readonly unknown[];
}

export interface MulticallParams<TAllowFailure extends boolean = true> {
	readonly contracts: readonly MulticallContract[];
	readonly allowFailure?: TAllowFailure;
	readonly blockTag?: BlockTag;
}

export type MulticallResultSuccess = {
	readonly status: "success";
	readonly result: unknown;
};

export type MulticallResultFailure = {
	readonly status: "failure";
	readonly error: Error;
};

export type MulticallResult<TAllowFailure extends boolean = true> =
	TAllowFailure extends true
		? (MulticallResultSuccess | MulticallResultFailure)[]
		: unknown[];

export const multicall = <TAllowFailure extends boolean = true>(
	params: MulticallParams<TAllowFailure>,
): Effect.Effect<
	MulticallResult<TAllowFailure>,
	ProviderError,
	ProviderService
> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		const allowFailure = params.allowFailure ?? true;

		if (params.contracts.length === 0) {
			return [] as MulticallResult<TAllowFailure>;
		}

		const calls = params.contracts.map((contract) => [
			contract.address,
			allowFailure,
			BrandedAbi.encodeFunction(
				contract.abi as unknown as BrandedAbiType,
				contract.functionName,
				(contract.args ?? []) as unknown[],
			),
		]);

		const data = BrandedAbi.encodeFunction(
			MULTICALL3_ABI as unknown as BrandedAbiType,
			"aggregate3",
			[calls],
		);

		const result = yield* provider
			.call({ to: MULTICALL3_ADDRESS, data }, params.blockTag)
			.pipe(
				Effect.mapError(
					(e) =>
						new ProviderError(
							{ contracts: params.contracts.length, blockTag: params.blockTag },
							e.message,
							{ cause: e, code: e.code },
						),
				),
			);

		const decoded = BrandedAbi.Function.decodeResult(
			MULTICALL3_ABI[0] as unknown as BrandedAbi.Function.FunctionType,
			Hex.toBytes(result as `0x${string}`),
		);

		const results = decoded[0] as Array<{
			success: boolean;
			returnData: Uint8Array;
		}>;

		return results.map((r, i) => {
			const contract = params.contracts[i];
			const fn = (contract.abi as readonly { type: string; name?: string }[]).find(
				(item) => item.type === "function" && item.name === contract.functionName,
			);

			if (!r.success) {
				if (allowFailure) {
					return { status: "failure" as const, error: new Error("Call reverted") };
				}
				throw new Error(`Call ${i} failed`);
			}

			const decodedResult = fn
				? BrandedAbi.Function.decodeResult(
						fn as BrandedAbi.Function.FunctionType,
						r.returnData,
					)
				: [];

			const outputs = (fn as { outputs?: readonly unknown[] })?.outputs ?? [];
			const value = outputs.length === 1 ? decodedResult[0] : decodedResult;

			return allowFailure
				? { status: "success" as const, result: value }
				: value;
		}) as MulticallResult<TAllowFailure>;
	});
