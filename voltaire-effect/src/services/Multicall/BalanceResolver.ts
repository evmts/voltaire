/**
 * @fileoverview RequestResolver for batching ERC-20 balanceOf calls via Multicall.
 *
 * @module BalanceResolver
 * @since 0.0.1
 */

import {
	Address,
	type Abi as BrandedAbiType,
	BrandedAbi,
	Hex,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";
import type { AddressInput, BlockTag } from "../Provider/ProviderService.js";
import { GetBalance } from "./GetBalance.js";
import {
	MulticallError,
	MulticallService,
	type MulticallCall,
} from "./MulticallService.js";

const BALANCE_OF_ABI = [
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ name: "balance", type: "uint256" }],
	},
] as const;

const BALANCE_OF_FN =
	BALANCE_OF_ABI[0] as unknown as BrandedAbi.Function.FunctionType;

const normalizeAddress = (input: AddressInput): `0x${string}` =>
	typeof input === "string"
		? input
		: (Address.toHex(input) as `0x${string}`);

const normalizeBlockTag = (blockTag?: BlockTag): BlockTag =>
	blockTag ?? "latest";

const encodeBalanceOf = (account: AddressInput): `0x${string}` =>
	BrandedAbi.encodeFunction(
		BALANCE_OF_ABI as unknown as BrandedAbiType,
		"balanceOf",
		[account] as unknown[],
	) as `0x${string}`;

const decodeBalance = (data: `0x${string}`): bigint => {
	const bytes = Hex.toBytes(data);
	const decoded = BrandedAbi.Function.decodeResult(BALANCE_OF_FN, bytes);
	const value = BALANCE_OF_FN.outputs.length === 1 ? decoded[0] : decoded;
	if (typeof value !== "bigint") {
		throw new Error("Unexpected balanceOf return type");
	}
	return value;
};

type BalanceEntry = {
	readonly request: GetBalance;
	readonly index: number;
};

/**
 * RequestResolver that batches GetBalance requests using Multicall3 aggregate3.
 *
 * @since 0.0.1
 */
export const BalanceResolver: RequestResolver.RequestResolver<
	GetBalance,
	MulticallService
> = RequestResolver.makeBatched((requests: readonly GetBalance[]) =>
	Effect.gen(function* () {
		if (requests.length === 0) return;

		const multicall = yield* MulticallService;
		const groups = new Map<BlockTag, BalanceEntry[]>();

		for (const [index, request] of requests.entries()) {
			const blockTag = normalizeBlockTag(request.blockTag);
			const group = groups.get(blockTag);
			if (group) {
				group.push({ request, index });
			} else {
				groups.set(blockTag, [{ request, index }]);
			}
		}

		yield* Effect.forEach(
			Array.from(groups.entries()),
			([blockTag, entries]) =>
				Effect.gen(function* () {
					const calls: MulticallCall[] = [];
					const callEntries: BalanceEntry[] = [];

					for (const entry of entries) {
						try {
							const callData = encodeBalanceOf(entry.request.account);
							calls.push({
								target: normalizeAddress(entry.request.address),
								callData,
								allowFailure: true,
							});
							callEntries.push(entry);
						} catch (e) {
							yield* Request.fail(
								entry.request,
								new MulticallError({
									message: "Failed to encode balanceOf call",
									failedCalls: [entry.index],
									cause: e,
								}),
							);
						}
					}

					if (calls.length === 0) return;

					const results = yield* Effect.either(
						multicall.aggregate3(calls, blockTag),
					);

					if (results._tag === "Left") {
						yield* Effect.forEach(
							callEntries,
							(entry) => Request.fail(entry.request, results.left),
							{ discard: true },
						);
						return;
					}

					const responseList = results.right;

					yield* Effect.forEach(
						callEntries,
						(entry, callIndex) =>
							Effect.gen(function* () {
								const response = responseList[callIndex];
								if (!response) {
									return yield* Request.fail(
										entry.request,
										new MulticallError({
											message: `Missing multicall result for index ${callIndex}`,
											failedCalls: [entry.index],
										}),
									);
								}

								if (!response.success) {
									return yield* Request.fail(
										entry.request,
										new MulticallError({
											message: "BalanceOf call failed",
											failedCalls: [entry.index],
										}),
									);
								}

								const decoded = yield* Effect.either(
									Effect.try({
										try: () => decodeBalance(response.returnData),
										catch: (e) =>
											new MulticallError({
												message: "Failed to decode balanceOf result",
												failedCalls: [entry.index],
												cause: e,
											}),
									}),
								);

								if (decoded._tag === "Left") {
									return yield* Request.fail(entry.request, decoded.left);
								}

								return yield* Request.succeed(entry.request, decoded.right);
							}),
						{ discard: true },
					);
				}),
			{ discard: true },
		);
	}),
);
