/**
 * @fileoverview Contract gas estimation helper.
 *
 * @module Contract/estimateGas
 * @since 0.0.1
 */

import {
	Address,
	BrandedAbi,
	type BrandedAddress,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { ProviderService } from "../Provider/index.js";
import {
	type Abi,
	type AbiItem,
	ContractCallError,
	type ContractInstance,
	type WriteOptions,
} from "./ContractTypes.js";

type AddressType = BrandedAddress.AddressType;

type WriteMethodName<TAbi extends Abi> = keyof ContractInstance<TAbi>["write"];

type WriteMethodArgs<
	TAbi extends Abi,
	TFunctionName extends WriteMethodName<TAbi>,
> = Parameters<ContractInstance<TAbi>["write"][TFunctionName]>;

const isWriteOptions = (value: unknown): value is WriteOptions =>
	value !== null &&
	typeof value === "object" &&
	!Array.isArray(value) &&
	("value" in value ||
		"gas" in value ||
		"gasPrice" in value ||
		"maxFeePerGas" in value ||
		"maxPriorityFeePerGas" in value ||
		"nonce" in value);

const getAddressHex = (address: AddressType | `0x${string}`): `0x${string}` =>
	(typeof address === "string"
		? address
		: Address.toHex(address as AddressType)) as `0x${string}`;

const findFunctionInputs = (
	abiItems: readonly AbiItem[],
	functionName: string,
	argLength: number,
) => {
	const matches = abiItems.filter(
		(item): item is AbiItem & { name: string } =>
			item.type === "function" && item.name === functionName,
	);
	if (matches.length === 0) return undefined;

	const exact = matches.find(
		(fn) => (fn.inputs?.length ?? 0) === argLength,
	);
	if (exact) return exact.inputs ?? [];

	const withOptions = matches.find(
		(fn) => (fn.inputs?.length ?? 0) + 1 === argLength,
	);
	if (withOptions) return withOptions.inputs ?? [];

	return matches[0].inputs ?? [];
};

/**
 * Estimates gas for a contract method call.
 *
 * @param contract - Contract instance
 * @param methodName - Method to estimate gas for
 * @param args - Method arguments (optionally ending with write options)
 * @returns Effect yielding estimated gas
 *
 * @example
 * ```typescript
 * const gas = yield* Contract.estimateGas(token, "transfer", [to, amount])
 * ```
 *
 * @since 0.0.1
 */
export const estimateGas = <
	TAbi extends Abi,
	TFunctionName extends WriteMethodName<TAbi>,
>(
	contract: ContractInstance<TAbi>,
	methodName: TFunctionName,
	args?: WriteMethodArgs<TAbi, TFunctionName>,
): Effect.Effect<bigint, ContractCallError, ProviderService> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		const addressHex = getAddressHex(contract.address as AddressType);
		const abiItems = contract.abi as readonly AbiItem[];
		const functionLabel = String(methodName);
		const inputArgs = (args ?? []) as readonly unknown[];

		const inputs = findFunctionInputs(abiItems, functionLabel, inputArgs.length);
		if (!inputs) {
			return yield* Effect.fail(
				new ContractCallError(
					{ address: addressHex, method: functionLabel, args: inputArgs },
					`Function ${functionLabel} not found in ABI`,
				),
			);
		}

		const inputCount = inputs.length;
		const lastArg = inputArgs[inputArgs.length - 1];
		const hasOptions =
			isWriteOptions(lastArg) && inputArgs.length > inputCount;

		const callArgs = hasOptions ? inputArgs.slice(0, -1) : inputArgs;
		const options = hasOptions ? (lastArg as WriteOptions) : undefined;

		const data = yield* Effect.try({
			try: () =>
				BrandedAbi.encodeFunction(
					abiItems as unknown as BrandedAbi.Abi,
					functionLabel,
					callArgs,
				),
			catch: (e) =>
				new ContractCallError(
					{
						address: addressHex,
						method: functionLabel,
						args: callArgs,
						value: options?.value,
					},
					e instanceof Error ? e.message : "Encode error",
					{ cause: e instanceof Error ? e : undefined },
				),
		});

		return yield* provider
			.estimateGas({
				to: addressHex,
				data,
				value: options?.value,
				gas: options?.gas,
			})
			.pipe(
				Effect.mapError(
					(e) =>
						new ContractCallError(
							{
								address: addressHex,
								method: functionLabel,
								args: callArgs,
								value: options?.value,
							},
							e.message,
							{ cause: e },
						),
				),
			);
	});
