/**
 * @fileoverview Explorer Contract factory for dynamic contract creation.
 *
 * @module ExplorerContract
 * @since 0.0.1
 *
 * @description
 * Creates contract instances from addresses by resolving ABIs via BlockExplorerApiService.
 * Provides dynamic (non-type-safe) contract interaction.
 */

import {
	Address,
	BrandedAbi,
	type BrandedHash,
	type BrandedHex,
	Hex,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import type {
	AbiItem,
	AbiResolution,
	ExplorerContractOptions,
} from "./BlockExplorerApiTypes.js";
import type { BlockExplorerApiError } from "./BlockExplorerApiErrors.js";
import { BlockExplorerApiService } from "./BlockExplorerApiService.js";
import { ContractCallError, ContractWriteError } from "../Contract/ContractTypes.js";
import { ProviderService } from "../Provider/ProviderService.js";
import { SignerService } from "../Signer/SignerService.js";
import { call } from "../Provider/functions/index.js";

type HexType = BrandedHex.HexType;
type HashType = BrandedHash.HashType;

/**
 * Dynamic contract instance created from resolved ABI.
 * @since 0.0.1
 */
export interface ExplorerContractInstance {
	readonly address: `0x${string}`;
	readonly requestedAddress: `0x${string}`;
	readonly abi: ReadonlyArray<AbiItem>;
	readonly resolution: AbiResolution;

	readonly read: Record<
		string,
		(...args: ReadonlyArray<unknown>) => Effect.Effect<unknown, ContractCallError, ProviderService>
	>;

	readonly simulate: Record<
		string,
		(...args: ReadonlyArray<unknown>) => Effect.Effect<unknown, ContractCallError, ProviderService>
	>;

	readonly write: Record<
		string,
		(...args: ReadonlyArray<unknown>) => Effect.Effect<`0x${string}`, ContractWriteError, SignerService>
	>;

	readonly call: (
		signature: string,
		args: ReadonlyArray<unknown>,
	) => Effect.Effect<unknown, ContractCallError, ProviderService>;
}

function getFunctionSignature(item: AbiItem): string {
	const inputs = item.inputs ?? [];
	const types = inputs.map((i) => i.type).join(",");
	return `${item.name ?? ""}(${types})`;
}

function isViewFunction(item: AbiItem): boolean {
	return (
		item.type === "function" &&
		(item.stateMutability === "view" || item.stateMutability === "pure")
	);
}

function isWriteFunction(item: AbiItem): boolean {
	return (
		item.type === "function" &&
		(item.stateMutability === "nonpayable" || item.stateMutability === "payable")
	);
}

/**
 * Encodes function arguments for a contract call using the ABI.
 */
function encodeArgs(
	abi: ReadonlyArray<AbiItem>,
	functionName: string,
	args: ReadonlyArray<unknown>,
): HexType {
	return BrandedAbi.encodeFunction(
		abi as unknown as BrandedAbi.Abi,
		functionName,
		args as unknown[],
	);
}

/**
 * Decodes the result of a contract call.
 */
function decodeResult(
	abi: ReadonlyArray<AbiItem>,
	functionName: string,
	data: HexType,
): Effect.Effect<unknown, ContractCallError> {
	return Effect.try({
		try: () => {
			const fn = abi.find(
				(item): item is BrandedAbi.Function.FunctionType =>
					item.type === "function" && (item as any).name === functionName,
			) as BrandedAbi.Function.FunctionType | undefined;
			if (!fn) throw new Error(`Function ${functionName} not found in ABI`);

			const bytes = Hex.toBytes(data);
			const decoded = BrandedAbi.Function.decodeResult(fn, bytes);
			if (fn.outputs.length === 1) {
				return decoded[0];
			}
			return decoded;
		},
		catch: (e) =>
			new ContractCallError(
				{ address: "", method: functionName, args: [] },
				e instanceof Error ? e.message : "Decode error",
				{ cause: e instanceof Error ? e : undefined },
			),
	});
}

function buildMethodMaps(
	address: `0x${string}`,
	abi: ReadonlyArray<AbiItem>,
): Pick<ExplorerContractInstance, "read" | "simulate" | "write" | "call"> {
	const functions = abi.filter((item) => item.type === "function");

	const byName = new Map<string, AbiItem[]>();
	for (const fn of functions) {
		if (!fn.name) continue;
		const existing = byName.get(fn.name) ?? [];
		existing.push(fn);
		byName.set(fn.name, existing);
	}

	const bySignature = new Map<string, AbiItem>();
	for (const fn of functions) {
		if (!fn.name) continue;
		const sig = getFunctionSignature(fn);
		bySignature.set(sig, fn);
	}

	const createReadMethod = (
		fn: AbiItem,
	): ((...args: ReadonlyArray<unknown>) => Effect.Effect<unknown, ContractCallError, ProviderService>) => {
		return (...args: ReadonlyArray<unknown>) =>
			Effect.gen(function* () {
				const data = encodeArgs(abi, fn.name!, args);
				const result = yield* call({ to: address, data }).pipe(
					Effect.mapError(
						(e) =>
							new ContractCallError(
								{ address, method: fn.name!, args: args as unknown[] },
								e.message,
								{ cause: e },
							),
					),
				);
				return yield* decodeResult(abi, fn.name!, result as HexType);
			});
	};

	const createSimulateMethod = (
		fn: AbiItem,
	): ((...args: ReadonlyArray<unknown>) => Effect.Effect<unknown, ContractCallError, ProviderService>) => {
		return (...args: ReadonlyArray<unknown>) =>
			Effect.gen(function* () {
				const data = encodeArgs(abi, fn.name!, args);
				const result = yield* call({ to: address, data }).pipe(
					Effect.mapError(
						(e) =>
							new ContractCallError(
								{ address, method: fn.name!, args: args as unknown[], simulate: true },
								e.message,
								{ cause: e },
							),
					),
				);
				return yield* decodeResult(abi, fn.name!, result as HexType);
			});
	};

	const createWriteMethod = (
		fn: AbiItem,
	): ((...args: ReadonlyArray<unknown>) => Effect.Effect<`0x${string}`, ContractWriteError, SignerService>) => {
		return (...args: ReadonlyArray<unknown>) =>
			Effect.gen(function* () {
				const signer = yield* SignerService;
				const data = encodeArgs(abi, fn.name!, args);
				const brandedAddress = Address.fromHex(address);
				const txHash = yield* signer
					.sendTransaction({
						to: brandedAddress as unknown as undefined,
						data: data as unknown as undefined,
					})
					.pipe(
						Effect.mapError(
							(e) =>
								new ContractWriteError(
									{ address, method: fn.name!, args: args as unknown[] },
									e.message,
									{ cause: e instanceof Error ? e : undefined },
								),
						),
					);
				return txHash as unknown as `0x${string}`;
			});
	};

	const read: Record<
		string,
		(...args: ReadonlyArray<unknown>) => Effect.Effect<unknown, ContractCallError, ProviderService>
	> = {};

	for (const fn of functions) {
		if (!fn.name || !isViewFunction(fn)) continue;

		const sig = getFunctionSignature(fn);
		const overloads = byName.get(fn.name) ?? [];

		read[sig] = createReadMethod(fn);

		if (overloads.length === 1) {
			read[fn.name] = createReadMethod(fn);
		}
	}

	const simulate: Record<
		string,
		(...args: ReadonlyArray<unknown>) => Effect.Effect<unknown, ContractCallError, ProviderService>
	> = {};

	for (const fn of functions) {
		if (!fn.name || !isWriteFunction(fn)) continue;

		const sig = getFunctionSignature(fn);
		const overloads = byName.get(fn.name) ?? [];

		simulate[sig] = createSimulateMethod(fn);
		if (overloads.length === 1) {
			simulate[fn.name] = createSimulateMethod(fn);
		}
	}

	const write: Record<
		string,
		(...args: ReadonlyArray<unknown>) => Effect.Effect<`0x${string}`, ContractWriteError, SignerService>
	> = {};

	for (const fn of functions) {
		if (!fn.name || !isWriteFunction(fn)) continue;

		const sig = getFunctionSignature(fn);
		const overloads = byName.get(fn.name) ?? [];

		write[sig] = createWriteMethod(fn);
		if (overloads.length === 1) {
			write[fn.name] = createWriteMethod(fn);
		}
	}

	const callFn = (
		signature: string,
		args: ReadonlyArray<unknown>,
	): Effect.Effect<unknown, ContractCallError, ProviderService> => {
		const fn = bySignature.get(signature);
		if (!fn) {
			return Effect.fail(
				new ContractCallError(
					{ address, method: signature, args: args as unknown[] },
					`Function not found: ${signature}`,
				),
			);
		}
		return createReadMethod(fn)(...args);
	};

	return { read, simulate, write, call: callFn };
}

/**
 * Create a contract instance from an address by resolving ABI via BlockExplorerApiService.
 * @since 0.0.1
 */
export function ExplorerContract(
	address: `0x${string}`,
	options?: ExplorerContractOptions,
): Effect.Effect<
	ExplorerContractInstance,
	BlockExplorerApiError | ContractCallError | ContractWriteError,
	BlockExplorerApiService | ProviderService
> {
	return Effect.gen(function* () {
		const explorer = yield* BlockExplorerApiService;

		const contract = yield* explorer.getContract(address, {
			resolution: options?.resolution,
			followProxies: options?.followProxies,
			includeSources: false,
		});

		const methods = buildMethodMaps(contract.address, contract.abi);

		return {
			address: contract.address,
			requestedAddress: contract.requestedAddress,
			abi: contract.abi,
			resolution: contract.resolution,
			...methods,
		};
	});
}
