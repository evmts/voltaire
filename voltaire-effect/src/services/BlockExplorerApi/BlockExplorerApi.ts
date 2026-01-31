/**
 * @fileoverview Block Explorer API layer factory.
 *
 * @module BlockExplorerApi
 * @since 0.0.1
 *
 * @description
 * Factory functions for creating BlockExplorerApiService layers.
 * Supports explicit configuration and environment-based configuration.
 */

import {
	Address,
	BrandedAbi,
	type BrandedHex,
	Hex,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Runtime from "effect/Runtime";
import { Redacted } from "effect";
import { ContractCallError, ContractWriteError } from "../Contract/ContractTypes.js";
import { ProviderService } from "../Provider/ProviderService.js";
import { SignerService } from "../Signer/SignerService.js";
import { getCode, call, getStorageAt } from "../Provider/functions/index.js";

type HexType = BrandedHex.HexType;
import {
	BlockExplorerConfigError,
	BlockExplorerNotFoundError,
	BlockExplorerRateLimitError,
	BlockExplorerResponseError,
	BlockExplorerDecodeError,
	BlockExplorerUnexpectedError,
	BlockExplorerProxyResolutionError,
} from "./BlockExplorerApiErrors.js";
import { BlockExplorerApiService, type BlockExplorerApiShape } from "./BlockExplorerApiService.js";
import type {
	AbiItem,
	BlockExplorerApiConfig,
	ContractSourceFile,
	ExplorerContractInstance,
	ExplorerSourceId,
	GetAbiOptions,
	GetContractOptions,
	GetSourcesOptions,
} from "./BlockExplorerApiTypes.js";
import type { BlockExplorerApiError } from "./BlockExplorerApiErrors.js";
import { ChainService } from "../Chain/ChainService.js";

// WhatsAbi imports
import { loaders, autoload, abiFromBytecode } from "@shazow/whatsabi";

// Type for WhatsAbi ABI (ABIFunction | ABIEvent)[]
type WhatsAbiItem = {
	type: "function" | "event";
	selector?: string;
	hash?: string;
	name?: string;
	outputs?: Array<{ type: string; name: string; components?: Array<{ type: string; name: string }> }>;
	inputs?: Array<{ type: string; name: string; components?: Array<{ type: string; name: string }> }>;
	sig?: string;
	sigAlts?: string[];
	payable?: boolean;
	stateMutability?: "nonpayable" | "payable" | "view" | "pure";
};
type WhatsABI = WhatsAbiItem[];

/**
 * Default source order for resolution.
 */
const DEFAULT_SOURCE_ORDER: ReadonlyArray<ExplorerSourceId> = [
	"sourcify",
	"etherscanV2",
	"blockscout",
];

/**
 * Normalize ABI from WhatsAbi format to our standard format.
 */
function normalizeAbi(rawAbi: WhatsABI): ReadonlyArray<AbiItem> {
	return rawAbi.map((item: WhatsAbiItem): AbiItem | null => {
		if (item.type === "function") {
			return {
				type: "function",
				name: item.name,
				inputs: item.inputs?.map((i: { type: string; name: string; components?: Array<{ type: string; name: string }> }) => ({
					name: i.name,
					type: i.type,
					components: i.components as AbiItem["inputs"],
				})),
				outputs: item.outputs?.map((o: { type: string; name: string; components?: Array<{ type: string; name: string }> }) => ({
					name: o.name,
					type: o.type,
					components: o.components as AbiItem["outputs"],
				})),
				stateMutability: item.stateMutability,
			};
		}
		if (item.type === "event") {
			return {
				type: "event",
				name: item.name,
				anonymous: false,
			};
		}
		return null;
	}).filter((item: AbiItem | null): item is AbiItem => item !== null);
}

/**
 * Detect rate limit from response.
 */
function isRateLimitResponse(body: string): boolean {
	const lower = body.toLowerCase();
	return (
		lower.includes("rate limit") ||
		lower.includes("too many requests") ||
		lower.includes("max rate limit reached")
	);
}

/**
 * Parse retry-after from rate limit response.
 */
function parseRetryAfter(body: string): number | undefined {
	const match = body.match(/(\d+)\s*seconds?/i);
	return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Get API key as string from config (handles Redacted).
 */
function getApiKey(
	key: Redacted.Redacted<string> | string | undefined,
): string | undefined {
	if (key === undefined) return undefined;
	if (typeof key === "string") return key;
	return Redacted.value(key);
}

/**
 * Create loaders based on configuration.
 */
function createLoaders(
	config: BlockExplorerApiConfig,
	chainId: number,
): loaders.ABILoader[] {
	const result: loaders.ABILoader[] = [];
	const sourceOrder = config.sourceOrder ?? DEFAULT_SOURCE_ORDER;

	for (const source of sourceOrder) {
		const sourceConfig = config.sources[source];
		if (!sourceConfig?.enabled) continue;

		switch (source) {
			case "sourcify": {
				result.push(
					new loaders.SourcifyABILoader({
						chainId,
						...(sourceConfig.baseUrl && { baseURL: sourceConfig.baseUrl }),
					}),
				);
				break;
			}
			case "etherscanV2": {
				const apiKey = getApiKey(
					(sourceConfig as typeof config.sources.etherscanV2)?.apiKey,
				);
				if (apiKey) {
					result.push(
						new loaders.EtherscanABILoader({
							apiKey,
							...(sourceConfig.baseUrl && { baseURL: sourceConfig.baseUrl }),
						}),
					);
				}
				break;
			}
			case "blockscout": {
				const apiKey = getApiKey(
					(sourceConfig as typeof config.sources.blockscout)?.apiKey,
				);
				result.push(
					new loaders.BlockscoutABILoader({
						...(apiKey && { apiKey }),
						...(sourceConfig.baseUrl && { baseURL: sourceConfig.baseUrl }),
					}),
				);
				break;
			}
		}
	}

	return result;
}

/**
 * Map WhatsAbi loader error to typed error.
 */
function mapLoaderError(
	error: unknown,
	source: ExplorerSourceId,
	address: `0x${string}`,
): BlockExplorerApiError {
	if (error instanceof Error) {
		const message = error.message;

		if (isRateLimitResponse(message)) {
			return new BlockExplorerRateLimitError(
				source,
				address,
				message,
				parseRetryAfter(message),
			);
		}

		if (
			message.includes("not found") ||
			message.includes("not verified") ||
			message.includes("404")
		) {
			return new BlockExplorerNotFoundError(address, [source]);
		}

		if (
			message.includes("JSON") ||
			message.includes("parse") ||
			message.includes("decode")
		) {
			return new BlockExplorerDecodeError(
				source,
				address,
				message,
				message.slice(0, 200),
			);
		}

		return new BlockExplorerResponseError(source, address, message);
	}

	return new BlockExplorerUnexpectedError("getContract", String(error), error);
}

/**
 * Determine which source returned the ABI based on the loader instance.
 */
function getSourceFromLoader(
	loader: loaders.ABILoader,
): ExplorerSourceId {
	if (loader instanceof loaders.SourcifyABILoader) return "sourcify";
	if (loader instanceof loaders.EtherscanABILoader) return "etherscanV2";
	if (loader instanceof loaders.BlockscoutABILoader) return "blockscout";
	return "sourcify"; // Default fallback
}

/**
 * WhatsAbi provider interface for autoload.
 */
interface WhatsAbiProvider {
	getCode(address: string): Promise<string>;
	getStorageAt(address: string, slot: number | string): Promise<string>;
	call(tx: { to: string; data: string }): Promise<string>;
}

// ============================================================================
// Contract method building helpers
// ============================================================================

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
 * Create the BlockExplorerApiService implementation.
 */
function makeBlockExplorerApi(
	config: BlockExplorerApiConfig,
): Effect.Effect<
	BlockExplorerApiShape,
	BlockExplorerConfigError,
	ChainService | ProviderService
> {
	return Effect.gen(function* () {
		const chain = yield* ChainService;
		const chainId = chain.id;

		// Capture runtime for bridging Effect to Promise in proxy resolution
		const runtime = yield* Effect.runtime<ProviderService>();
		const runPromise = Runtime.runPromise(runtime);

		const enabledSources = (
			Object.entries(config.sources) as [ExplorerSourceId, { enabled: boolean } | undefined][]
		).filter(([_, v]) => v?.enabled);

		if (enabledSources.length === 0) {
			return yield* Effect.fail(
				new BlockExplorerConfigError(
					"At least one explorer source must be enabled",
				),
			);
		}

		const abiLoaders = createLoaders(config, chainId);

		const cache = new Map<
			string,
			{ value: ExplorerContractInstance; expiry: number }
		>();
		const cacheEnabled = config.cache?.enabled ?? false;
		const cacheTtl = config.cache?.ttlMillis ?? 300_000;
		const cacheCapacity = config.cache?.capacity ?? 100;

		function getCacheKey(
			address: `0x${string}`,
			options?: GetContractOptions,
		): string {
			return `${chainId}:${address.toLowerCase()}:${options?.followProxies ?? config.followProxiesByDefault ?? false}`;
		}

		function getFromCache(
			key: string,
		): ExplorerContractInstance | undefined {
			if (!cacheEnabled) return undefined;
			const entry = cache.get(key);
			if (!entry) return undefined;
			if (Date.now() > entry.expiry) {
				cache.delete(key);
				return undefined;
			}
			return entry.value;
		}

		function setCache(key: string, value: ExplorerContractInstance): void {
			if (!cacheEnabled) return;
			if (cache.size >= cacheCapacity) {
				const oldest = cache.keys().next().value;
				if (oldest) cache.delete(oldest);
			}
			cache.set(key, { value, expiry: Date.now() + cacheTtl });
		}

		const getContract = (
			address: `0x${string}`,
			options?: GetContractOptions,
		): Effect.Effect<ExplorerContractInstance, BlockExplorerApiError> =>
			Effect.gen(function* () {
				const cacheKey = getCacheKey(address, options);
				const cached = getFromCache(cacheKey);
				if (cached) return cached;

				const resolution = options?.resolution ?? "verified-first";
				const includeSources = options?.includeSources ?? false;
				const shouldFollowProxies = options?.followProxies ?? config.followProxiesByDefault ?? false;

				// Create WhatsAbi-compatible provider using our Effect-based provider
				const whatsabiProvider: WhatsAbiProvider = {
					getCode: (addr: string) =>
						runPromise(getCode(addr as `0x${string}`)),
					getStorageAt: (addr: string, slot: number | string) => {
						const slotHex = typeof slot === "number"
							? `0x${slot.toString(16)}` as `0x${string}`
							: slot.startsWith("0x") ? slot as `0x${string}` : `0x${slot}` as `0x${string}`;
						return runPromise(getStorageAt(addr as `0x${string}`, slotHex));
					},
					call: (tx: { to: string; data: string }) =>
						runPromise(call({ to: tx.to as `0x${string}`, data: tx.data as `0x${string}` })),
				};

				// Create combined loader from our configured sources
				const combinedLoader = abiLoaders.length > 0
					? new loaders.MultiABILoader(abiLoaders)
					: false;

				// Use autoload for unified ABI loading + proxy resolution
				const result = yield* Effect.tryPromise({
					try: () => autoload(address, {
						provider: whatsabiProvider,
						abiLoader: combinedLoader,
						followProxies: shouldFollowProxies,
						signatureLookup: false, // Don't do 4byte lookups
					}),
					catch: (e) => {
						const message = e instanceof Error ? e.message : String(e);
						if (isRateLimitResponse(message)) {
							return new BlockExplorerRateLimitError(
								"etherscanV2",
								address,
								message,
								parseRetryAfter(message),
							);
						}
						if (message.includes("not found") || message.includes("not verified")) {
							return new BlockExplorerNotFoundError(address, ["autoload"]);
						}
						return new BlockExplorerUnexpectedError("getContract", message, e);
					},
				});

				// Handle case where no ABI was found from verified sources
				if (!result.abi || result.abi.length === 0) {
					if (resolution === "best-effort" && config.enableBestEffortAbiRecovery) {
						// Try to recover ABI from bytecode using static analysis
						const bytecode = yield* Effect.tryPromise({
							try: () => whatsabiProvider.getCode(result.address),
							catch: () => new BlockExplorerUnexpectedError(
								"getContract",
								"Failed to fetch bytecode for best-effort recovery",
								undefined,
							),
						});

						if (bytecode && bytecode !== "0x" && bytecode !== "0x0") {
							const recoveredAbi = yield* Effect.try({
								try: () => abiFromBytecode(bytecode),
								catch: (e) => new BlockExplorerUnexpectedError(
									"getContract",
									`Failed to recover ABI from bytecode: ${e instanceof Error ? e.message : String(e)}`,
									e,
								),
							});

							if (recoveredAbi && recoveredAbi.length > 0) {
								const normalizedAbi = normalizeAbi(recoveredAbi as WhatsABI);
								const resolvedAddr = result.address as `0x${string}`;
								const methods = buildMethodMaps(resolvedAddr, normalizedAbi);

								const contract: ExplorerContractInstance = {
									address: resolvedAddr,
									requestedAddress: address,
									abi: normalizedAbi,
									resolution: { mode: "best-effort", source: "whatsabi" },
									...(result.proxies.length > 0 && {
										proxies: result.proxies.map(p => ({
											kind: p.name,
											address: address,
										})),
									}),
									...methods,
								};

								setCache(cacheKey, contract);
								return contract;
							}
						}
					}
					return yield* Effect.fail(
						new BlockExplorerNotFoundError(address, ["autoload"]),
					);
				}

				// Extract proxy chain from result
				const proxyChain: Array<{ kind: string; address: `0x${string}` }> = result.proxies.map(p => ({
					kind: p.name,
					address: address, // Original address was the proxy
				}));

				// Determine which source returned the ABI
				const source: ExplorerSourceId = result.abiLoadedFrom
					? getSourceFromLoader(result.abiLoadedFrom)
					: "sourcify";

				const normalizedAbi = normalizeAbi(result.abi as WhatsABI);
				const resolvedAddr = result.address as `0x${string}`;
				const methods = buildMethodMaps(resolvedAddr, normalizedAbi);

				const contract: ExplorerContractInstance = {
					address: resolvedAddr,
					requestedAddress: address,
					abi: normalizedAbi,
					resolution: { mode: "verified", source },
					...(proxyChain.length > 0 && { proxies: proxyChain }),
					...(includeSources && { sources: [] as ContractSourceFile[] }),
					...methods,
				};

				setCache(cacheKey, contract);
				return contract;
			});

		const getAbi = (
			address: `0x${string}`,
			options?: GetAbiOptions,
		): Effect.Effect<ReadonlyArray<AbiItem>, BlockExplorerApiError> =>
			Effect.map(
				getContract(address, {
					resolution: options?.resolution,
					followProxies: options?.followProxies,
					includeSources: false,
				}),
				(contract) => contract.abi,
			);

		const getSources = (
			address: `0x${string}`,
			options?: GetSourcesOptions,
		): Effect.Effect<ReadonlyArray<ContractSourceFile>, BlockExplorerApiError> =>
			Effect.flatMap(
				getContract(address, {
					includeSources: true,
					followProxies: options?.followProxies,
				}),
				(contract) => {
					if (!contract.sources || contract.sources.length === 0) {
						return Effect.fail(
							new BlockExplorerNotFoundError(address, ["sources"]),
						);
					}
					return Effect.succeed(contract.sources);
				},
			);

		return { getContract, getAbi, getSources };
	});
}

/**
 * Create a BlockExplorerApiService layer from explicit configuration.
 * Requires ChainService. ProviderService is required when followProxies is used.
 * @since 0.0.1
 */
export function BlockExplorerApi(
	config: BlockExplorerApiConfig,
): Layer.Layer<BlockExplorerApiService, BlockExplorerConfigError, ChainService | ProviderService> {
	return Layer.effect(BlockExplorerApiService, makeBlockExplorerApi(config));
}

/**
 * Create a BlockExplorerApiService layer from environment variables.
 * Requires ChainService. ProviderService is required when followProxies is used.
 * @since 0.0.1
 */
BlockExplorerApi.fromEnv = function fromEnv(): Layer.Layer<
	BlockExplorerApiService,
	BlockExplorerConfigError,
	ChainService | ProviderService
> {
	return Layer.effect(
		BlockExplorerApiService,
		Effect.gen(function* () {
			const etherscanKey =
				typeof process !== "undefined"
					? process.env.ETHERSCAN_API_KEY
					: undefined;
			const blockscoutKey =
				typeof process !== "undefined"
					? process.env.BLOCKSCOUT_API_KEY
					: undefined;
			const sourcesEnv =
				typeof process !== "undefined"
					? process.env.VOLTAIRE_EXPLORER_SOURCES
					: undefined;

			const sourceOrder: ExplorerSourceId[] = sourcesEnv
				? (sourcesEnv.split(",").map((s) => s.trim()) as ExplorerSourceId[])
				: (["sourcify", "etherscanV2", "blockscout"] as const).slice();

			const config: BlockExplorerApiConfig = {
				sources: {
					sourcify: { enabled: true },
					etherscanV2: {
						enabled: true,
						apiKey: etherscanKey ? Redacted.make(etherscanKey) : undefined,
					},
					blockscout: {
						enabled: true,
						apiKey: blockscoutKey ? Redacted.make(blockscoutKey) : undefined,
					},
				},
				sourceOrder,
				cache: {
					enabled: true,
					ttlMillis: 300_000,
					capacity: 100,
				},
			};

			return yield* makeBlockExplorerApi(config);
		}),
	);
};
