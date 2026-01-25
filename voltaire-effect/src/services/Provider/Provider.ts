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

import * as Clock from "effect/Clock";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";
import { TransportService } from "../Transport/TransportService.js";

/**
 * Internal error codes for retry logic.
 * Using codes outside typical JSON-RPC ranges (-32000 to -32099) to avoid conflicts.
 */
const INTERNAL_CODE_PENDING = -40001;
const INTERNAL_CODE_WAITING_CONFIRMATIONS = -40002;
import {
	type AccessListType,
	type AddressInput,
	type BlockTag,
	type BlockType,
	type CallRequest,
	type FeeHistoryType,
	type GetBlockArgs,
	type HashInput,
	type LogFilter,
	type LogType,
	ProviderError,
	ProviderService,
	type ReceiptType,
	type TransactionType,
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
const formatCallRequest = (tx: CallRequest): Record<string, string> => {
	const formatted: Record<string, string> = {};
	if (tx.from) formatted.from = toAddressHex(tx.from);
	if (tx.to) formatted.to = toAddressHex(tx.to);
	if (tx.data) formatted.data = tx.data as string;
	if (tx.value !== undefined) formatted.value = `0x${tx.value.toString(16)}`;
	if (tx.gas !== undefined) formatted.gas = `0x${tx.gas.toString(16)}`;
	return formatted;
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
						Effect.map((hex) => BigInt(hex)),
					),

				getBlock: (args?: GetBlockArgs) => {
					const method = args?.blockHash
						? "eth_getBlockByHash"
						: "eth_getBlockByNumber";
					const params = args?.blockHash
						? [toHashHex(args.blockHash), args?.includeTransactions ?? false]
						: [args?.blockTag ?? "latest", args?.includeTransactions ?? false];
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
				opts?: { confirmations?: number; timeout?: number },
			) =>
				Effect.gen(function* () {
					const confirmations = opts?.confirmations ?? 1;
					if (confirmations < 1) {
						return yield* Effect.fail(
							new ProviderError(
								{ hash, confirmations },
								"Confirmations must be at least 1",
							),
						);
					}

					const timeout = opts?.timeout ?? 60000;
					const startTime = yield* Clock.currentTimeMillis;
					const deadline = startTime + timeout;
					const hashHex = toHashHex(hash);

					const remainingTime = Effect.gen(function* () {
						const now = yield* Clock.currentTimeMillis;
						return Math.max(0, Number(deadline - now));
					});

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

					const remaining1 = yield* remainingTime;
					if (remaining1 <= 0) {
						return yield* Effect.fail(
							new ProviderError(
								{ hash, timeout },
								"Timeout waiting for transaction receipt",
							),
						);
					}

					const receipt = yield* pollReceipt.pipe(
						Effect.retry({
							schedule: Schedule.spaced(1000),
							while: (e) =>
								e instanceof ProviderError &&
								e.code === INTERNAL_CODE_PENDING,
							until: () =>
								remainingTime.pipe(Effect.map((remaining) => remaining <= 0)),
						}),
						Effect.timeout(remaining1),
						Effect.catchTag("TimeoutException", () =>
							Effect.fail(
								new ProviderError(
									{ hash, timeout },
									"Timeout waiting for transaction receipt",
								),
							),
						),
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

					const remaining2 = yield* remainingTime;
					if (remaining2 <= 0) {
						return yield* Effect.fail(
							new ProviderError(
								{ hash, timeout },
								"Timeout waiting for confirmations",
							),
						);
					}

					return yield* pollConfirmations.pipe(
						Effect.retry({
							schedule: Schedule.spaced(1000),
							while: (e) =>
								e instanceof ProviderError &&
								e.code === INTERNAL_CODE_WAITING_CONFIRMATIONS,
							until: () =>
								remainingTime.pipe(Effect.map((remaining) => remaining <= 0)),
						}),
						Effect.timeout(remaining2),
						Effect.catchTag("TimeoutException", () =>
							Effect.fail(
								new ProviderError(
									{ hash, timeout },
									"Timeout waiting for confirmations",
								),
							),
						),
					);
				}),

				call: (tx: CallRequest, blockTag: BlockTag = "latest") =>
					request<`0x${string}`>("eth_call", [formatCallRequest(tx), blockTag]),

				estimateGas: (tx: CallRequest) =>
					request<string>("eth_estimateGas", [formatCallRequest(tx)]).pipe(
						Effect.map((hex) => BigInt(hex)),
					),

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
						Effect.map((hex) => BigInt(hex)),
					),

				getMaxPriorityFeePerGas: () =>
					request<string>("eth_maxPriorityFeePerGas").pipe(
						Effect.map((hex) => BigInt(hex)),
					),

				getFeeHistory: (
					blockCount: number,
					newestBlock: BlockTag,
					rewardPercentiles: number[],
				) =>
					request<FeeHistoryType>("eth_feeHistory", [
						`0x${blockCount.toString(16)}`,
						newestBlock,
						rewardPercentiles,
					]),
			};
		}),
	);
