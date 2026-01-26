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
	BlockStream as CoreBlockStream,
	type BackfillOptions,
	type BlockInclude,
	type BlocksEvent,
	type BlockStreamEvent,
	type WatchOptions,
} from "@tevm/voltaire/block";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Runtime from "effect/Runtime";
import * as Schedule from "effect/Schedule";
import * as Stream from "effect/Stream";
import { TransportService } from "../Transport/TransportService.js";

/**
 * Internal error codes for retry logic.
 * Using codes outside typical JSON-RPC ranges (-32000 to -32099) to avoid conflicts.
 */
const INTERNAL_CODE_PENDING = -40001;
const INTERNAL_CODE_WAITING_CONFIRMATIONS = -40002;
import {
	type AccessListType,
	type AccountStateOverride,
	type AddressInput,
	type BlockOverrides,
	type BlockTag,
	type BlockType,
	type CallRequest,
	type FeeHistoryType,
	type GetBlockArgs,
	type GetUncleArgs,
	type HashInput,
	type LogFilter,
	type LogType,
	type ProofType,
	ProviderError,
	ProviderService,
	type ReceiptType,
	type StateOverride,
	type TransactionType,
	type UncleBlockType,
} from "./ProviderService.js";

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
const toAddressHex = (input: AddressInput): string => {
	if (typeof input === "string") return input;
	return bytesToHex(input);
};

/**
 * Converts HashInput to hex string for RPC calls.
 * Handles both branded HashType (Uint8Array) and plain hex strings.
 */
const toHashHex = (input: HashInput): string => {
	if (typeof input === "string") return input;
	return bytesToHex(input);
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
 * - Maps transport errors to ProviderError
 *
 * Requires TransportService in context.
 *
 * @since 0.0.1
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import { Provider, ProviderService, HttpTransport } from 'voltaire-effect/services'
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
 * } from 'voltaire-effect/services'
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
 * import { Provider, ProviderService, TestTransport } from 'voltaire-effect/services'
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
						(e) =>
							new ProviderError({ method, params }, e.message, {
								cause: e,
								code: e.code,
								context: { method, params },
							}),
					),
				);

			return {
				getBlockNumber: () =>
					request<string>("eth_blockNumber").pipe(
						Effect.flatMap((hex) =>
							Effect.try({
								try: () => BigInt(hex),
								catch: (e) =>
									new ProviderError(
										{ method: "eth_blockNumber", response: hex },
										`Invalid hex response from RPC: ${hex}`,
										{ cause: e instanceof Error ? e : undefined },
									),
							}),
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
								: Effect.fail(new ProviderError(args ?? {}, "Block not found")),
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
						Effect.map((hex) => BigInt(hex)),
					);
				},

				getBalance: (address: AddressInput, blockTag: BlockTag = "latest") =>
					request<string>("eth_getBalance", [
						toAddressHex(address),
						blockTag,
					]).pipe(Effect.map((hex) => BigInt(hex))),

				getTransactionCount: (
					address: AddressInput,
					blockTag: BlockTag = "latest",
				) =>
					request<string>("eth_getTransactionCount", [
						toAddressHex(address),
						blockTag,
					]).pipe(Effect.map((hex) => BigInt(hex))),

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
										new ProviderError({ hash }, "Transaction not found"),
									),
						),
					),

				getTransactionReceipt: (hash: HashInput) =>
					request<ReceiptType | null>("eth_getTransactionReceipt", [
						toHashHex(hash),
					]).pipe(
						Effect.flatMap((receipt) =>
							receipt
								? Effect.succeed(receipt)
								: Effect.fail(
										new ProviderError(
											{ hash },
											"Transaction receipt not found (pending or unknown)",
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
								new ProviderError(
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
											new ProviderError({ hash }, "Transaction pending", {
												code: INTERNAL_CODE_PENDING,
											}),
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
										(e: ProviderError) => e.code === INTERNAL_CODE_PENDING,
									),
								),
							),
							Effect.timeoutFail({
								duration: Duration.millis(timeout),
								onTimeout: () =>
									new ProviderError(
										{ hash, timeout },
										"Timeout waiting for transaction receipt",
									),
							}),
						);

						if (confirmations <= 1) {
							return receipt;
						}

						const receiptBlockNumber = BigInt(receipt.blockNumber);
						const targetBlock = receiptBlockNumber + BigInt(confirmations - 1);

						const pollConfirmations = Effect.gen(function* () {
							const currentBlockHex = yield* request<string>("eth_blockNumber");
							const currentBlock = BigInt(currentBlockHex);
							if (currentBlock >= targetBlock) {
								return receipt;
							}
							return yield* Effect.fail(
								new ProviderError(
									{ hash, currentBlock, targetBlock },
									"Waiting for confirmations",
									{ code: INTERNAL_CODE_WAITING_CONFIRMATIONS },
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
										(e: ProviderError) =>
											e.code === INTERNAL_CODE_WAITING_CONFIRMATIONS,
									),
								),
							),
							Effect.timeoutFail({
								duration: Duration.millis(timeout),
								onTimeout: () =>
									new ProviderError(
										{ hash, timeout },
										"Timeout waiting for confirmations",
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
							Effect.try({
								try: () => BigInt(hex),
								catch: (e) =>
									new ProviderError(
										{ method: "eth_estimateGas", response: hex },
										`Invalid hex response from RPC: ${hex}`,
										{ cause: e instanceof Error ? e : undefined },
									),
							}),
						),
					);
				},

				createAccessList: (tx: CallRequest) =>
					request<AccessListType>("eth_createAccessList", [
						formatCallRequest(tx),
					]),

				getLogs: (filter: LogFilter) => {
					const params: Record<string, unknown> = {};
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
					if (filter.fromBlock) params.fromBlock = filter.fromBlock;
					if (filter.toBlock) params.toBlock = filter.toBlock;
					if (filter.blockHash) params.blockHash = toHashHex(filter.blockHash);
					return request<LogType[]>("eth_getLogs", [params]);
				},

				getChainId: () =>
					request<string>("eth_chainId").pipe(
						Effect.flatMap((hex) => {
							const value = BigInt(hex);
							if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
								return Effect.fail(
									new ProviderError(
										{ method: "eth_chainId" },
										`Chain ID ${value} exceeds safe integer range`,
									),
								);
							}
							return Effect.succeed(Number(value));
						}),
					),

				getGasPrice: () =>
					request<string>("eth_gasPrice").pipe(
						Effect.flatMap((hex) =>
							Effect.try({
								try: () => BigInt(hex),
								catch: (e) =>
									new ProviderError(
										{ method: "eth_gasPrice", response: hex },
										`Invalid hex response from RPC: ${hex}`,
										{ cause: e instanceof Error ? e : undefined },
									),
							}),
						),
					),

				getMaxPriorityFeePerGas: () =>
					request<string>("eth_maxPriorityFeePerGas").pipe(
						Effect.flatMap((hex) =>
							Effect.try({
								try: () => BigInt(hex),
								catch: (e) =>
									new ProviderError(
										{ method: "eth_maxPriorityFeePerGas", response: hex },
										`Invalid hex response from RPC: ${hex}`,
										{ cause: e instanceof Error ? e : undefined },
									),
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
								new ProviderError(
									{ blockCount },
									"blockCount must be a positive integer",
								),
							);
						}
						for (const p of rewardPercentiles) {
							if (p < 0 || p > 100) {
								return yield* Effect.fail(
									new ProviderError(
										{ rewardPercentiles },
										"rewardPercentiles values must be between 0 and 100",
									),
								);
							}
						}
						for (let i = 1; i < rewardPercentiles.length; i++) {
							if (rewardPercentiles[i] < rewardPercentiles[i - 1]) {
								return yield* Effect.fail(
									new ProviderError(
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

				watchBlocks: <TInclude extends BlockInclude = "header">(
					options?: WatchOptions<TInclude>,
				): Stream.Stream<BlockStreamEvent<TInclude>, ProviderError> =>
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
									Runtime.runPromise(runtime)(transport.request(method, params)),
								on: () => {},
								removeListener: () => {},
							};
							const coreStream = CoreBlockStream({ provider: provider as any });
							return Stream.fromAsyncIterable(
								{ [Symbol.asyncIterator]: () => coreStream.watch(options) },
								(error) =>
									new ProviderError(
										{ method: "watchBlocks", options },
										error instanceof Error ? error.message : "BlockStream error",
										{ cause: error instanceof Error ? error : undefined },
									),
							);
						}),
					),

				backfillBlocks: <TInclude extends BlockInclude = "header">(
					options: BackfillOptions<TInclude>,
				): Stream.Stream<BlocksEvent<TInclude>, ProviderError> =>
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
									Runtime.runPromise(runtime)(transport.request(method, params)),
								on: () => {},
								removeListener: () => {},
							};
							const coreStream = CoreBlockStream({ provider: provider as any });
							return Stream.fromAsyncIterable(
								{ [Symbol.asyncIterator]: () => coreStream.backfill(options) },
								(error) =>
									new ProviderError(
										{ method: "backfillBlocks", options },
										error instanceof Error ? error.message : "BlockStream error",
										{ cause: error instanceof Error ? error : undefined },
									),
							);
						}),
					),

				sendRawTransaction: (signedTx: `0x${string}`) =>
					request<`0x${string}`>("eth_sendRawTransaction", [signedTx]),

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
										new ProviderError(args, "Uncle block not found"),
									),
						),
					);
				},

				getProof: (
					address: AddressInput,
					storageKeys: (`0x${string}`)[],
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
					request<string>("eth_blobBaseFee").pipe(
						Effect.flatMap((hex) =>
							Effect.try({
								try: () => BigInt(hex),
								catch: (e) =>
									new ProviderError(
										{ method: "eth_blobBaseFee", response: hex },
										`Invalid hex response from RPC: ${hex}`,
										{ cause: e instanceof Error ? e : undefined },
									),
							}),
						),
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
						const receiptBlock = BigInt(receipt.blockNumber);
						const current = BigInt(currentBlock);
						if (current < receiptBlock) {
							return 0n;
						}
						return current - receiptBlock + 1n;
					}),
			};
		}),
	);
