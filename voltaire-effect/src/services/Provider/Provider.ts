/**
 * @fileoverview Live implementation of ProviderService.
 *
 * @module Provider
 * @since 0.0.1
 *
 * @description
 * Provides the live implementation layer for ProviderService. This layer
 * translates the high-level ProviderService methods into JSON-RPC calls
 * via the TransportService.
 *
 * The layer requires a TransportService to be provided (HttpTransport,
 * WebSocketTransport, BrowserTransport, or TestTransport).
 *
 * @see {@link ProviderService} - The service interface
 * @see {@link TransportService} - Required dependency
 * @see {@link HttpTransport} - Common transport for RPC calls
 */

import {
	type BackfillOptions,
	type BlockInclude,
	type BlockStreamEvent,
	type BlocksEvent,
	BlockStream as CoreBlockStream,
	type WatchOptions,
} from "@tevm/voltaire/block";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Runtime from "effect/Runtime";
import * as Schedule from "effect/Schedule";
import * as Stream from "effect/Stream";
import { TransportError } from "../Transport/TransportError.js";
import { TransportService } from "../Transport/TransportService.js";
import { getBlobBaseFee as getBlobBaseFeeEffect } from "./getBlobBaseFee.js";
import type { SyncingStatus, WorkResult } from "./NetworkService.js";
import {
	type AccessListInput,
	type AccessListType,
	type AddressInput,
	type BackfillBlocksError,
	type BlockOverrides,
	type BlockTag,
	type BlockType,
	type CallRequest,
	type EventFilter,
	type FeeHistoryType,
	type FilterChanges,
	type FilterId,
	type GetBlockArgs,
	type GetBlockReceiptsArgs,
	type GetUncleArgs,
	type GetUncleCountArgs,
	type HashInput,
	type LogFilter,
	type LogType,
	type ProofType,
	ProviderConfirmationsPendingError,
	ProviderNotFoundError,
	ProviderReceiptPendingError,
	ProviderResponseError,
	ProviderService,
	ProviderStreamError,
	ProviderTimeoutError,
	ProviderValidationError,
	type ReceiptType,
	type RpcTransactionRequest,
	type StateOverride,
	type TransactionIndexInput,
	type TransactionType,
	type UncleBlockType,
	type WatchBlocksError,
} from "./ProviderService.js";
import type {
	SimulateV1Payload,
	SimulateV1Result,
	SimulateV2Payload,
	SimulateV2Result,
} from "./SimulationService.js";

/**
 * Converts a Uint8Array to hex string.
 */
const bytesToHex = (bytes: Uint8Array): `0x${string}` => {
	let hex = "0x";
	for (let i = 0; i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, "0");
	}
	return hex as `0x${string}`;
};

/**
 * Converts AddressInput to hex string for RPC calls.
 * Handles both branded AddressType (Uint8Array) and plain hex strings.
 */
const toAddressHex = (input: AddressInput): `0x${string}` => {
	if (typeof input === "string") return input as `0x${string}`;
	return bytesToHex(input) as `0x${string}`;
};

/**
 * Converts HashInput to hex string for RPC calls.
 * Handles both branded HashType (Uint8Array) and plain hex strings.
 */
const toHashHex = (input: HashInput): `0x${string}` => {
	if (typeof input === "string") return input as `0x${string}`;
	return bytesToHex(input) as `0x${string}`;
};

/**
 * Parses a hex quantity into bigint with consistent provider error handling.
 */
const parseHexToBigInt = (input: {
	method: string;
	response: string;
	params?: unknown[];
}) =>
	Effect.try({
		try: () => BigInt(input.response),
		catch: (error) =>
			new ProviderResponseError(
				input,
				`Invalid hex response from RPC: ${input.response}`,
				{ cause: error instanceof Error ? error : undefined },
			),
	});

type LogFilterParams = {
	address?: AddressInput | AddressInput[];
	topics?: (HashInput | HashInput[] | null)[];
	fromBlock?: BlockTag;
	toBlock?: BlockTag;
	blockHash?: HashInput;
};

type RpcLogFilterParams = {
	address?: `0x${string}` | `0x${string}`[];
	topics?: (string | string[] | null)[];
	fromBlock?: BlockTag;
	toBlock?: BlockTag;
	blockHash?: `0x${string}`;
};

/**
 * Formats log filter parameters for JSON-RPC submission.
 */
const formatLogFilterParams = (filter: LogFilterParams): RpcLogFilterParams => {
	const params: RpcLogFilterParams = {};
	if (filter.address) {
		params.address = Array.isArray(filter.address)
			? filter.address.map(toAddressHex)
			: toAddressHex(filter.address);
	}
	if (filter.topics) {
		params.topics = filter.topics.map((topic) => {
			if (topic === null) return null;
			if (Array.isArray(topic)) return topic.map(toHashHex);
			return toHashHex(topic);
		});
	}
	if (filter.fromBlock !== undefined) params.fromBlock = filter.fromBlock;
	if (filter.toBlock !== undefined) params.toBlock = filter.toBlock;
	if (filter.blockHash !== undefined) {
		params.blockHash = toHashHex(filter.blockHash) as `0x${string}`;
	}
	return params;
};

/**
 * RPC call object for eth_call, eth_estimateGas, etc.
 * All values are hex-encoded strings per JSON-RPC spec.
 */
type RpcCallObject = {
	from?: `0x${string}`;
	to?: `0x${string}`;
	data?: `0x${string}`;
	value?: `0x${string}`;
	gas?: `0x${string}`;
	gasPrice?: `0x${string}`;
	maxFeePerGas?: `0x${string}`;
	maxPriorityFeePerGas?: `0x${string}`;
	nonce?: `0x${string}`;
};

type RpcAccessList = Array<{
	address: `0x${string}`;
	storageKeys: Array<`0x${string}`>;
}>;

type RpcTransactionObject = RpcCallObject & {
	to?: `0x${string}` | null;
	accessList?: RpcAccessList;
	chainId?: `0x${string}`;
	type?: `0x${string}`;
	maxFeePerBlobGas?: `0x${string}`;
	blobVersionedHashes?: readonly `0x${string}`[];
};

/**
 * Formats a CallRequest for JSON-RPC submission.
 *
 * @description
 * Converts bigint values to hex strings and filters out undefined fields
 * to create a valid JSON-RPC call object.
 *
 * @param tx - The call request to format
 * @returns Formatted object with hex-encoded values
 *
 * @internal
 */
const formatCallRequest = (tx: CallRequest): RpcCallObject => {
	const formatted: RpcCallObject = {};
	if (tx.from) formatted.from = toAddressHex(tx.from) as `0x${string}`;
	if (tx.to) formatted.to = toAddressHex(tx.to) as `0x${string}`;
	if (tx.data) formatted.data = tx.data;
	if (tx.value !== undefined) formatted.value = `0x${tx.value.toString(16)}`;
	if (tx.gas !== undefined) formatted.gas = `0x${tx.gas.toString(16)}`;
	return formatted;
};

const formatAccessList = (accessList: AccessListInput): RpcAccessList =>
	accessList.map((entry) => ({
		address: toAddressHex(entry.address),
		storageKeys: entry.storageKeys,
	}));

const formatTransactionRequest = (
	tx: RpcTransactionRequest,
): RpcTransactionObject => {
	const formatted: RpcTransactionObject = {};
	formatted.from = toAddressHex(tx.from);
	if (tx.to !== undefined) {
		if (tx.to !== null) {
			formatted.to = toAddressHex(tx.to);
		}
	}
	if (tx.data) formatted.data = tx.data;
	if (tx.value !== undefined) formatted.value = `0x${tx.value.toString(16)}`;
	if (tx.gas !== undefined) formatted.gas = `0x${tx.gas.toString(16)}`;
	if (tx.gasPrice !== undefined) {
		formatted.gasPrice = `0x${tx.gasPrice.toString(16)}`;
	}
	if (tx.maxFeePerGas !== undefined) {
		formatted.maxFeePerGas = `0x${tx.maxFeePerGas.toString(16)}`;
	}
	if (tx.maxPriorityFeePerGas !== undefined) {
		formatted.maxPriorityFeePerGas = `0x${tx.maxPriorityFeePerGas.toString(16)}`;
	}
	if (tx.nonce !== undefined) {
		formatted.nonce = `0x${tx.nonce.toString(16)}`;
	}
	if (tx.accessList !== undefined) {
		formatted.accessList = formatAccessList(tx.accessList);
	}
	if (tx.chainId !== undefined) {
		formatted.chainId = `0x${tx.chainId.toString(16)}`;
	}
	if (tx.type !== undefined) {
		formatted.type = `0x${tx.type.toString(16)}`;
	}
	if (tx.maxFeePerBlobGas !== undefined) {
		formatted.maxFeePerBlobGas = `0x${tx.maxFeePerBlobGas.toString(16)}`;
	}
	if (tx.blobVersionedHashes !== undefined) {
		formatted.blobVersionedHashes = tx.blobVersionedHashes;
	}
	return formatted;
};

const toIndexHex = (index: TransactionIndexInput): `0x${string}` => {
	if (typeof index === "string") return index as `0x${string}`;
	const value = typeof index === "number" ? BigInt(index) : index;
	return `0x${value.toString(16)}` as `0x${string}`;
};

const formatSimulateV1Payload = (payload: SimulateV1Payload) => ({
	...payload,
	blockStateCalls: payload.blockStateCalls.map((block) => ({
		...block,
		blockOverrides: block.blockOverrides
			? formatBlockOverrides(block.blockOverrides)
			: undefined,
		stateOverrides: block.stateOverrides
			? formatStateOverride(block.stateOverrides)
			: undefined,
		calls: block.calls.map(formatCallRequest),
	})),
});

/**
 * RPC state override object for eth_call.
 */
type RpcAccountStateOverride = {
	balance?: `0x${string}`;
	nonce?: `0x${string}`;
	code?: `0x${string}`;
	state?: Record<`0x${string}`, `0x${string}`>;
	stateDiff?: Record<`0x${string}`, `0x${string}`>;
};

type RpcStateOverride = Record<`0x${string}`, RpcAccountStateOverride>;

/**
 * Formats a StateOverride for JSON-RPC submission.
 *
 * @description
 * Converts bigint values to hex strings for balance and nonce.
 *
 * @param stateOverride - The state override to format
 * @returns Formatted object with hex-encoded values
 *
 * @internal
 */
const formatStateOverride = (
	stateOverride: StateOverride,
): RpcStateOverride => {
	const result: RpcStateOverride = {};
	for (const [address, override] of Object.entries(stateOverride)) {
		const formattedOverride: RpcAccountStateOverride = {};
		if (override.balance !== undefined) {
			formattedOverride.balance = `0x${override.balance.toString(16)}`;
		}
		if (override.nonce !== undefined) {
			formattedOverride.nonce = `0x${override.nonce.toString(16)}`;
		}
		if (override.code !== undefined) {
			formattedOverride.code = override.code;
		}
		if (override.state !== undefined) {
			formattedOverride.state = override.state;
		}
		if (override.stateDiff !== undefined) {
			formattedOverride.stateDiff = override.stateDiff;
		}
		result[address as `0x${string}`] = formattedOverride;
	}
	return result;
};

/**
 * RPC block overrides object for eth_call.
 */
type RpcBlockOverrides = {
	number?: `0x${string}`;
	difficulty?: `0x${string}`;
	time?: `0x${string}`;
	gasLimit?: `0x${string}`;
	coinbase?: `0x${string}`;
	random?: `0x${string}`;
	baseFee?: `0x${string}`;
};

/**
 * Formats BlockOverrides for JSON-RPC submission.
 *
 * @param blockOverrides - The block overrides to format
 * @returns Formatted object with hex-encoded values
 *
 * @internal
 */
const formatBlockOverrides = (
	blockOverrides: BlockOverrides,
): RpcBlockOverrides => {
	const result: RpcBlockOverrides = {};
	if (blockOverrides.number !== undefined) {
		result.number = `0x${blockOverrides.number.toString(16)}`;
	}
	if (blockOverrides.difficulty !== undefined) {
		result.difficulty = `0x${blockOverrides.difficulty.toString(16)}`;
	}
	if (blockOverrides.time !== undefined) {
		result.time = `0x${blockOverrides.time.toString(16)}`;
	}
	if (blockOverrides.gasLimit !== undefined) {
		result.gasLimit = `0x${blockOverrides.gasLimit.toString(16)}`;
	}
	if (blockOverrides.coinbase !== undefined) {
		result.coinbase = toAddressHex(blockOverrides.coinbase) as `0x${string}`;
	}
	if (blockOverrides.random !== undefined) {
		result.random = toHashHex(blockOverrides.random) as `0x${string}`;
	}
	if (blockOverrides.baseFee !== undefined) {
		result.baseFee = `0x${blockOverrides.baseFee.toString(16)}`;
	}
	return result;
};

/**
 * Live implementation of the provider layer.
 *
 * @description
 * Provides a concrete implementation of ProviderService that translates
 * method calls to JSON-RPC requests via TransportService.
 *
 * This layer:
 * - Converts method parameters to JSON-RPC format
 * - Handles response parsing (hex to bigint, etc.)
 * - Surfaces TransportError and provider-specific errors
 *
 * Requires TransportService in context.
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { Provider, ProviderService, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   const blockNum = yield* provider.getBlockNumber()
 *   return blockNum
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 *
 * await Effect.runPromise(program)
 * ```
 *
 * @example Composing with other layers
 * ```typescript
 * import { Effect, Layer } from 'effect'
 * import {
 *   Provider,
 *   ProviderService,
 *   HttpTransport
 * } from 'voltaire-effect'
 *
 * // Create a composed layer for reuse
 * const MainnetProvider = Provider.pipe(
 *   Layer.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBlockNumber()
 * }).pipe(Effect.provide(MainnetProvider))
 * ```
 *
 * @example Testing with TestTransport
 * ```typescript
 * import { Effect } from 'effect'
 * import { Provider, ProviderService, TestTransport } from 'voltaire-effect'
 *
 * const testTransport = TestTransport({
 *   'eth_blockNumber': '0x1234',
 *   'eth_chainId': '0x1'
 * })
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(testTransport)
 * )
 *
 * const result = await Effect.runPromise(program)
 * expect(result).toBe(0x1234n)
 * ```
 *
 * @see {@link ProviderService} - The service interface
 * @see {@link TransportService} - Required transport dependency
 * @see {@link HttpTransport} - HTTP transport implementation
 * @see {@link TestTransport} - Mock transport for testing
 */
export const Provider: Layer.Layer<ProviderService, never, TransportService> =
	Layer.effect(
		ProviderService,
		Effect.gen(function* () {
			const transport = yield* TransportService;

			const request = <T>(method: string, params?: unknown[]) =>
				transport.request<T>(method, params).pipe(
					Effect.mapError(
						(error) =>
							new TransportError(error.input, error.message, {
								cause: error,
								context: { method, params },
							}),
					),
				);

			return {
				getBlockNumber: () =>
					request<string>("eth_blockNumber").pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({ method: "eth_blockNumber", response: hex }),
						),
					),

				getBlock: (args?: GetBlockArgs) => {
					const method = args?.blockHash
						? "eth_getBlockByHash"
						: "eth_getBlockByNumber";
					let blockId: string;
					if (args?.blockHash) {
						blockId = toHashHex(args.blockHash);
					} else if (args?.blockNumber !== undefined) {
						blockId = `0x${args.blockNumber.toString(16)}`;
					} else {
						blockId = args?.blockTag ?? "latest";
					}
					const params = [blockId, args?.includeTransactions ?? false];
					return request<BlockType | null>(method, params).pipe(
						Effect.flatMap((block) =>
							block
								? Effect.succeed(block)
								: Effect.fail(
										new ProviderNotFoundError(
											{ method, params, args },
											"Block not found",
											{ resource: "block" },
										),
									),
						),
					);
				},

				getBlockReceipts: (args?: GetBlockReceiptsArgs) => {
					const method = "eth_getBlockReceipts";
					let blockId: string;
					if (args?.blockHash) {
						blockId = toHashHex(args.blockHash);
					} else if (args?.blockNumber !== undefined) {
						blockId = `0x${args.blockNumber.toString(16)}`;
					} else {
						blockId = args?.blockTag ?? "latest";
					}
					const params = [blockId];
					return request<ReceiptType[] | null>(method, params).pipe(
						Effect.flatMap((receipts) =>
							receipts
								? Effect.succeed(receipts)
								: Effect.fail(
										new ProviderNotFoundError(
											{ method, params, args },
											"Block receipts not found",
											{ resource: "blockReceipts" },
										),
									),
						),
					);
				},

				getBlockTransactionCount: (args) => {
					const method = args.blockHash
						? "eth_getBlockTransactionCountByHash"
						: "eth_getBlockTransactionCountByNumber";
					const params = args.blockHash
						? [toHashHex(args.blockHash)]
						: [args.blockTag ?? "latest"];
					return request<string>(method, params).pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({ method, params, response: hex }),
						),
					);
				},

				getBalance: (address: AddressInput, blockTag: BlockTag = "latest") =>
					request<string>("eth_getBalance", [
						toAddressHex(address),
						blockTag,
					]).pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({
								method: "eth_getBalance",
								params: [toAddressHex(address), blockTag],
								response: hex,
							}),
						),
					),

				getTransactionCount: (
					address: AddressInput,
					blockTag: BlockTag = "latest",
				) =>
					request<string>("eth_getTransactionCount", [
						toAddressHex(address),
						blockTag,
					]).pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({
								method: "eth_getTransactionCount",
								params: [toAddressHex(address), blockTag],
								response: hex,
							}),
						),
					),

				getCode: (address: AddressInput, blockTag: BlockTag = "latest") =>
					request<`0x${string}`>("eth_getCode", [
						toAddressHex(address),
						blockTag,
					]),

				getStorageAt: (
					address: AddressInput,
					slot: HashInput,
					blockTag: BlockTag = "latest",
				) =>
					request<`0x${string}`>("eth_getStorageAt", [
						toAddressHex(address),
						toHashHex(slot),
						blockTag,
					]),

				getTransaction: (hash: HashInput) =>
					request<TransactionType | null>("eth_getTransactionByHash", [
						toHashHex(hash),
					]).pipe(
						Effect.flatMap((tx) =>
							tx
								? Effect.succeed(tx)
								: Effect.fail(
										new ProviderNotFoundError(
											{ hash },
											"Transaction not found",
											{ resource: "transaction" },
										),
									),
						),
					),

				getTransactionByBlockHashAndIndex: (
					blockHash: HashInput,
					index: TransactionIndexInput,
				) =>
					request<TransactionType | null>(
						"eth_getTransactionByBlockHashAndIndex",
						[toHashHex(blockHash), toIndexHex(index)],
					).pipe(
						Effect.flatMap((tx) =>
							tx
								? Effect.succeed(tx)
								: Effect.fail(
										new ProviderNotFoundError(
											{ blockHash, index },
											"Transaction not found",
											{ resource: "transaction" },
										),
									),
						),
					),

				getTransactionByBlockNumberAndIndex: (
					blockTag: BlockTag | bigint,
					index: TransactionIndexInput,
				) => {
					const blockRef =
						typeof blockTag === "bigint"
							? (`0x${blockTag.toString(16)}` as const)
							: blockTag;
					return request<TransactionType | null>(
						"eth_getTransactionByBlockNumberAndIndex",
						[blockRef, toIndexHex(index)],
					).pipe(
						Effect.flatMap((tx) =>
							tx
								? Effect.succeed(tx)
								: Effect.fail(
										new ProviderNotFoundError(
											{ blockTag, index },
											"Transaction not found",
											{ resource: "transaction" },
										),
									),
						),
					);
				},

				getTransactionReceipt: (hash: HashInput) =>
					request<ReceiptType | null>("eth_getTransactionReceipt", [
						toHashHex(hash),
					]).pipe(
						Effect.flatMap((receipt) =>
							receipt
								? Effect.succeed(receipt)
								: Effect.fail(
										new ProviderNotFoundError(
											{ hash },
											"Transaction receipt not found (pending or unknown)",
											{ resource: "receipt" },
										),
									),
						),
					),

				waitForTransactionReceipt: (
					hash: HashInput,
					opts?: {
						confirmations?: number;
						timeout?: number;
						pollingInterval?: number;
					},
				) =>
					Effect.gen(function* () {
						const confirmations = opts?.confirmations ?? 1;
						const pollingInterval = opts?.pollingInterval ?? 1000;
						if (confirmations < 1) {
							return yield* Effect.fail(
								new ProviderValidationError(
									{ hash, confirmations },
									"Confirmations must be at least 1",
								),
							);
						}

						const timeout = opts?.timeout ?? 60000;
						const hashHex = toHashHex(hash);

						const pollReceipt = request<ReceiptType | null>(
							"eth_getTransactionReceipt",
							[hashHex],
						).pipe(
							Effect.flatMap((receipt) =>
								receipt
									? Effect.succeed(receipt)
									: Effect.fail(
											new ProviderReceiptPendingError(
												{ hash },
												"Transaction pending",
											),
										),
							),
						);

						const receipt = yield* pollReceipt.pipe(
							Effect.retry(
								Schedule.spaced(Duration.millis(pollingInterval)).pipe(
									Schedule.intersect(
										Schedule.recurUpTo(Duration.millis(timeout)),
									),
									Schedule.whileInput(
										(e) =>
											(e as ProviderReceiptPendingError)._tag ===
											"ProviderReceiptPendingError",
									),
								),
							),
							Effect.timeoutFail({
								duration: Duration.millis(timeout),
								onTimeout: () =>
									new ProviderTimeoutError(
										{ hash, timeout },
										"Timeout waiting for transaction receipt",
										{ timeoutMs: timeout },
									),
							}),
						);

						if (confirmations <= 1) {
							return receipt;
						}

						const receiptBlockNumber = yield* parseHexToBigInt({
							method: "eth_getTransactionReceipt",
							params: [hashHex],
							response: receipt.blockNumber,
						});
						const targetBlock = receiptBlockNumber + BigInt(confirmations - 1);

						const pollConfirmations = Effect.gen(function* () {
							const currentBlockHex = yield* request<string>("eth_blockNumber");
							const currentBlock = yield* parseHexToBigInt({
								method: "eth_blockNumber",
								response: currentBlockHex,
							});
							if (currentBlock >= targetBlock) {
								return receipt;
							}
							return yield* Effect.fail(
								new ProviderConfirmationsPendingError(
									{ hash, currentBlock, targetBlock },
									"Waiting for confirmations",
								),
							);
						});

						return yield* pollConfirmations.pipe(
							Effect.retry(
								Schedule.spaced(Duration.millis(pollingInterval)).pipe(
									Schedule.intersect(
										Schedule.recurUpTo(Duration.millis(timeout)),
									),
									Schedule.whileInput(
										(e) =>
											(e as ProviderConfirmationsPendingError)._tag ===
											"ProviderConfirmationsPendingError",
									),
								),
							),
							Effect.timeoutFail({
								duration: Duration.millis(timeout),
								onTimeout: () =>
									new ProviderTimeoutError(
										{ hash, timeout },
										"Timeout waiting for confirmations",
										{ timeoutMs: timeout },
									),
							}),
						);
					}),

				call: (
					tx: CallRequest,
					blockTag: BlockTag = "latest",
					stateOverride?: StateOverride,
					blockOverrides?: BlockOverrides,
				) => {
					const params: unknown[] = [formatCallRequest(tx), blockTag];
					if (stateOverride !== undefined) {
						params.push(formatStateOverride(stateOverride));
					}
					if (blockOverrides !== undefined) {
						// Ensure stateOverride slot is filled when blockOverrides present
						if (stateOverride === undefined) {
							params.push({});
						}
						params.push(formatBlockOverrides(blockOverrides));
					}
					return request<`0x${string}`>("eth_call", params);
				},

				estimateGas: (
					tx: CallRequest,
					blockTag: BlockTag = "latest",
					stateOverride?: StateOverride,
				) => {
					const params: unknown[] = [formatCallRequest(tx), blockTag];
					if (stateOverride !== undefined) {
						params.push(formatStateOverride(stateOverride));
					}
					return request<string>("eth_estimateGas", params).pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({
								method: "eth_estimateGas",
								params,
								response: hex,
							}),
						),
					);
				},

				createAccessList: (tx: CallRequest) =>
					request<AccessListType>("eth_createAccessList", [
						formatCallRequest(tx),
					]),

				simulateV1: (
					payload: SimulateV1Payload,
					blockTag: BlockTag = "latest",
				) =>
					request<SimulateV1Result>("eth_simulateV1", [
						formatSimulateV1Payload(payload),
						blockTag,
					]),

				simulateV2: <TResult = SimulateV2Result>(
					payload: SimulateV2Payload,
					blockTag?: BlockTag,
				) => {
					const params =
						blockTag === undefined ? [payload] : [payload, blockTag];
					return request<TResult>("eth_simulateV2", params);
				},

				getLogs: (filter: LogFilter) => {
					const params = formatLogFilterParams(filter);
					return request<LogType[]>("eth_getLogs", [params]);
				},
				createEventFilter: (filter: EventFilter = {}) => {
					const params = formatLogFilterParams(filter);
					return request<FilterId>("eth_newFilter", [params]);
				},
				createBlockFilter: () => request<FilterId>("eth_newBlockFilter"),
				createPendingTransactionFilter: () =>
					request<FilterId>("eth_newPendingTransactionFilter"),
				getFilterChanges: (filterId: FilterId) =>
					request<FilterChanges>("eth_getFilterChanges", [filterId]),
				getFilterLogs: (filterId: FilterId) =>
					request<LogType[]>("eth_getFilterLogs", [filterId]),
				uninstallFilter: (filterId: FilterId) =>
					request<boolean>("eth_uninstallFilter", [filterId]),

				getChainId: () =>
					request<string>("eth_chainId").pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({ method: "eth_chainId", response: hex }).pipe(
								Effect.flatMap((value) => {
									if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
										return Effect.fail(
											new ProviderValidationError(
												{ method: "eth_chainId", value },
												`Chain ID ${value} exceeds safe integer range`,
											),
										);
									}
									return Effect.succeed(Number(value));
								}),
							),
						),
					),

				getGasPrice: () =>
					request<string>("eth_gasPrice").pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({ method: "eth_gasPrice", response: hex }),
						),
					),

				getMaxPriorityFeePerGas: () =>
					request<string>("eth_maxPriorityFeePerGas").pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({
								method: "eth_maxPriorityFeePerGas",
								response: hex,
							}),
						),
					),

				getFeeHistory: (
					blockCount: number,
					newestBlock: BlockTag,
					rewardPercentiles: number[],
				) =>
					Effect.gen(function* () {
						if (!Number.isInteger(blockCount) || blockCount < 1) {
							return yield* Effect.fail(
								new ProviderValidationError(
									{ blockCount },
									"blockCount must be a positive integer",
								),
							);
						}
						for (const p of rewardPercentiles) {
							if (p < 0 || p > 100) {
								return yield* Effect.fail(
									new ProviderValidationError(
										{ rewardPercentiles },
										"rewardPercentiles values must be between 0 and 100",
									),
								);
							}
						}
						for (let i = 1; i < rewardPercentiles.length; i++) {
							if (rewardPercentiles[i] < rewardPercentiles[i - 1]) {
								return yield* Effect.fail(
									new ProviderValidationError(
										{ rewardPercentiles },
										"rewardPercentiles should be sorted in ascending order",
									),
								);
							}
						}
						return yield* request<FeeHistoryType>("eth_feeHistory", [
							`0x${blockCount.toString(16)}`,
							newestBlock,
							rewardPercentiles,
						]);
					}),

				getSyncing: () => request<SyncingStatus>("eth_syncing"),

				getAccounts: () => request<`0x${string}`[]>("eth_accounts"),

				getCoinbase: () => request<`0x${string}`>("eth_coinbase"),

				netVersion: () => request<string>("net_version"),

				getProtocolVersion: () => request<string>("eth_protocolVersion"),

				getMining: () => request<boolean>("eth_mining"),

				getHashrate: () =>
					request<string>("eth_hashrate").pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({ method: "eth_hashrate", response: hex }),
						),
					),

				getWork: () => request<WorkResult>("eth_getWork"),

				submitWork: (
					nonce: `0x${string}`,
					powHash: `0x${string}`,
					mixDigest: `0x${string}`,
				) => request<boolean>("eth_submitWork", [nonce, powHash, mixDigest]),

				submitHashrate: (hashrate: `0x${string}`, id: `0x${string}`) =>
					request<boolean>("eth_submitHashrate", [hashrate, id]),

				watchBlocks: <TInclude extends BlockInclude = "header">(
					options?: WatchOptions<TInclude>,
				): Stream.Stream<BlockStreamEvent<TInclude>, WatchBlocksError> =>
					Stream.unwrap(
						Effect.gen(function* () {
							const runtime = yield* Effect.runtime<never>();
							const provider = {
								request: async ({
									method,
									params,
								}: {
									method: string;
									params?: unknown[];
								}) =>
									Runtime.runPromise(runtime)(
										transport.request(method, params),
									),
								on: () => {},
								removeListener: () => {},
							};
							const coreStream = CoreBlockStream({ provider: provider as any });
							return Stream.fromAsyncIterable(
								{ [Symbol.asyncIterator]: () => coreStream.watch(options) },
								(error) =>
									error instanceof TransportError
										? error
										: new ProviderStreamError(
												{ method: "watchBlocks", options },
												error instanceof Error
													? error.message
													: "BlockStream error",
												{ cause: error instanceof Error ? error : undefined },
											),
							);
						}),
					),

				backfillBlocks: <TInclude extends BlockInclude = "header">(
					options: BackfillOptions<TInclude>,
				): Stream.Stream<BlocksEvent<TInclude>, BackfillBlocksError> =>
					Stream.unwrap(
						Effect.gen(function* () {
							const runtime = yield* Effect.runtime<never>();
							const provider = {
								request: async ({
									method,
									params,
								}: {
									method: string;
									params?: unknown[];
								}) =>
									Runtime.runPromise(runtime)(
										transport.request(method, params),
									),
								on: () => {},
								removeListener: () => {},
							};
							const coreStream = CoreBlockStream({ provider: provider as any });
							return Stream.fromAsyncIterable(
								{ [Symbol.asyncIterator]: () => coreStream.backfill(options) },
								(error) =>
									error instanceof TransportError
										? error
										: new ProviderStreamError(
												{ method: "backfillBlocks", options },
												error instanceof Error
													? error.message
													: "BlockStream error",
												{ cause: error instanceof Error ? error : undefined },
											),
							);
						}),
					),

				subscribe: (subscription: string, params: readonly unknown[] = []) =>
					request<`0x${string}`>("eth_subscribe", [subscription, ...params]),

				unsubscribe: (subscriptionId: `0x${string}`) =>
					request<boolean>("eth_unsubscribe", [subscriptionId]),

				sendRawTransaction: (signedTx: HexType | `0x${string}`) =>
					request<`0x${string}`>("eth_sendRawTransaction", [signedTx]),

				sendTransaction: (tx: RpcTransactionRequest) =>
					request<`0x${string}`>("eth_sendTransaction", [
						formatTransactionRequest(tx),
					]),

				sign: (address: AddressInput, message: HexType | `0x${string}`) =>
					request<`0x${string}`>("eth_sign", [toAddressHex(address), message]),

				signTransaction: (tx: RpcTransactionRequest) =>
					request<unknown>("eth_signTransaction", [
						formatTransactionRequest(tx),
					]),

				getUncle: (args: GetUncleArgs, uncleIndex: `0x${string}`) => {
					const method = args.blockHash
						? "eth_getUncleByBlockHashAndIndex"
						: "eth_getUncleByBlockNumberAndIndex";
					const params = args.blockHash
						? [toHashHex(args.blockHash), uncleIndex]
						: [args.blockTag ?? "latest", uncleIndex];
					return request<UncleBlockType | null>(method, params).pipe(
						Effect.flatMap((uncle) =>
							uncle
								? Effect.succeed(uncle)
								: Effect.fail(
										new ProviderNotFoundError(
											{ args, method, params },
											"Uncle block not found",
											{ resource: "uncle" },
										),
									),
						),
					);
				},

				getUncleCount: (args: GetUncleCountArgs) => {
					const method = args.blockHash
						? "eth_getUncleCountByBlockHash"
						: "eth_getUncleCountByBlockNumber";
					const params = args.blockHash
						? [toHashHex(args.blockHash)]
						: [args.blockTag ?? "latest"];
					return request<string>(method, params).pipe(
						Effect.flatMap((hex) =>
							parseHexToBigInt({ method, params, response: hex }),
						),
					);
				},

				getProof: (
					address: AddressInput,
					storageKeys: HashInput[],
					blockTag: BlockTag = "latest",
				) =>
					request<ProofType>("eth_getProof", [
						toAddressHex(address),
						storageKeys.map((key) =>
							typeof key === "string" ? key : toHashHex(key),
						),
						blockTag,
					]),

				getBlobBaseFee: () =>
					getBlobBaseFeeEffect().pipe(
						Effect.provideService(TransportService, transport),
					),

				getTransactionConfirmations: (hash: HashInput) =>
					Effect.gen(function* () {
						const receipt = yield* request<ReceiptType | null>(
							"eth_getTransactionReceipt",
							[toHashHex(hash)],
						);
						if (!receipt) {
							return 0n;
						}
						const currentBlock = yield* request<string>("eth_blockNumber");
						const receiptBlock = yield* parseHexToBigInt({
							method: "eth_getTransactionReceipt",
							params: [toHashHex(hash)],
							response: receipt.blockNumber,
						});
						const current = yield* parseHexToBigInt({
							method: "eth_blockNumber",
							response: currentBlock,
						});
						if (current < receiptBlock) {
							return 0n;
						}
						return current - receiptBlock + 1n;
					}),
			};
		}),
	);
