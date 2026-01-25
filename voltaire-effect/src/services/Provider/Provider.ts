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

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";
import { TransportService } from "../Transport/TransportService.js";
import {
	type AccessListType,
	type AddressInput,
	type BlockTag,
	type BlockType,
	type CallRequest,
	type FeeHistoryType,
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
	if (tx.data) formatted.data = typeof tx.data === "string" ? tx.data : tx.data;
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
export const Provider: Layer.Layer<
	ProviderService,
	never,
	TransportService
> = Layer.effect(
	ProviderService,
	Effect.gen(function* () {
		const transport = yield* TransportService;

		const request = <T>(method: string, params?: unknown[]) =>
			transport.request<T>(method, params).pipe(
				Effect.mapError(
					(e) =>
						new ProviderError({ method, params }, e.message, {
							cause: e,
							context: { method, params },
						}),
				),
			);

		return {
			getBlockNumber: () =>
				request<string>("eth_blockNumber").pipe(
					Effect.map((hex) => BigInt(hex)),
				),

			getBlock: (args?: {
				blockTag?: BlockTag;
				blockHash?: HashInput;
				includeTransactions?: boolean;
			}) => {
				const method = args?.blockHash
					? "eth_getBlockByHash"
					: "eth_getBlockByNumber";
				const params = args?.blockHash
					? [toHashHex(args.blockHash), args?.includeTransactions ?? false]
					: [args?.blockTag ?? "latest", args?.includeTransactions ?? false];
				return request<BlockType>(method, params);
			},

			getBlockTransactionCount: (args: {
				blockTag?: BlockTag;
				blockHash?: HashInput;
			}) => {
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
				request<TransactionType>("eth_getTransactionByHash", [toHashHex(hash)]),

			getTransactionReceipt: (hash: HashInput) =>
				request<ReceiptType>("eth_getTransactionReceipt", [toHashHex(hash)]),

			waitForTransactionReceipt: (
				hash: HashInput,
				opts?: { confirmations?: number; timeout?: number },
			) => {
				const hashHex = toHashHex(hash);
				const confirmations = opts?.confirmations ?? 1;
				const timeoutMs = opts?.timeout ?? 60000;

				const checkReceipt: Effect.Effect<ReceiptType, ProviderError> =
					Effect.gen(function* () {
						const receipt = yield* request<ReceiptType | null>(
							"eth_getTransactionReceipt",
							[hashHex],
						);
						if (!receipt)
							return yield* Effect.fail(
								new ProviderError(hashHex, "Transaction pending"),
							);

						const currentBlock = yield* request<string>("eth_blockNumber");
						const receiptBlock = BigInt(receipt.blockNumber);
						if (
							BigInt(currentBlock) - receiptBlock >=
							BigInt(confirmations - 1)
						) {
							return receipt;
						}
						return yield* Effect.fail(
							new ProviderError(hashHex, "Waiting for confirmations"),
						);
					});

				return checkReceipt.pipe(
					Effect.retry(Schedule.spaced(1000)),
					Effect.timeout(timeoutMs),
					Effect.catchTag("TimeoutException", () =>
						Effect.fail(
							new ProviderError(hash, "Transaction receipt timeout"),
						),
					),
				);
			},

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
				request<string>("eth_gasPrice").pipe(Effect.map((hex) => BigInt(hex))),

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
