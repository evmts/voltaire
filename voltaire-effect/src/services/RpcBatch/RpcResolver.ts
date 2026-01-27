/**
 * @fileoverview RequestResolver for batching RPC requests using Effect patterns.
 *
 * @module RpcResolver
 * @since 0.0.1
 *
 * @description
 * Provides a RequestResolver that automatically batches multiple RPC requests
 * into a single JSON-RPC batch call. This is the idiomatic Effect way to handle
 * request batching compared to manual BatchScheduler approaches.
 *
 * Key features:
 * - Automatic batching via Effect.request
 * - Request deduplication (identical requests return same result)
 * - Per-request error handling
 * - Type-safe request/response mapping
 *
 * @see {@link RpcRequest} - The request types this resolver handles
 */

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Request from "effect/Request";
import * as RequestResolver from "effect/RequestResolver";
import { TransportError } from "../Transport/TransportError.js";
import { TransportService } from "../Transport/TransportService.js";
import type {
	EthBlockNumber,
	EthCall,
	EthChainId,
	EthEstimateGas,
	EthGasPrice,
	EthGetBalance,
	EthGetBlockByHash,
	EthGetBlockByNumber,
	EthGetCode,
	EthGetLogs,
	EthGetStorageAt,
	EthGetTransactionByHash,
	EthGetTransactionCount,
	EthGetTransactionReceipt,
	GenericRpcRequest,
	RpcRequest,
} from "./RpcRequest.js";

interface JsonRpcRequest {
	jsonrpc: "2.0";
	id: number;
	method: string;
	params?: readonly unknown[];
}

interface JsonRpcResponse {
	jsonrpc: "2.0";
	id: number;
	result?: unknown;
	error?: { code: number; message: string; data?: unknown };
}

const requestToRpc = (request: RpcRequest, id: number): JsonRpcRequest => {
	switch (request._tag) {
		case "EthBlockNumber":
			return { jsonrpc: "2.0", id, method: "eth_blockNumber", params: [] };

		case "EthGetBalance":
			return {
				jsonrpc: "2.0",
				id,
				method: "eth_getBalance",
				params: [request.address, request.blockTag],
			};

		case "EthGetTransactionCount":
			return {
				jsonrpc: "2.0",
				id,
				method: "eth_getTransactionCount",
				params: [request.address, request.blockTag],
			};

		case "EthChainId":
			return { jsonrpc: "2.0", id, method: "eth_chainId", params: [] };

		case "EthGasPrice":
			return { jsonrpc: "2.0", id, method: "eth_gasPrice", params: [] };

		case "EthGetCode":
			return {
				jsonrpc: "2.0",
				id,
				method: "eth_getCode",
				params: [request.address, request.blockTag],
			};

		case "EthGetStorageAt":
			return {
				jsonrpc: "2.0",
				id,
				method: "eth_getStorageAt",
				params: [request.address, request.position, request.blockTag],
			};

		case "EthCall": {
			const callObject: Record<string, string> = { to: request.to };
			if (request.data) callObject.data = request.data;
			if (request.from) callObject.from = request.from;
			if (request.gas) callObject.gas = request.gas;
			if (request.gasPrice) callObject.gasPrice = request.gasPrice;
			if (request.value) callObject.value = request.value;
			return {
				jsonrpc: "2.0",
				id,
				method: "eth_call",
				params: [callObject, request.blockTag],
			};
		}

		case "EthEstimateGas": {
			const txObject: Record<string, string> = {};
			if (request.to) txObject.to = request.to;
			if (request.data) txObject.data = request.data;
			if (request.from) txObject.from = request.from;
			if (request.gas) txObject.gas = request.gas;
			if (request.gasPrice) txObject.gasPrice = request.gasPrice;
			if (request.value) txObject.value = request.value;
			const params: unknown[] = [txObject];
			if (request.blockTag) params.push(request.blockTag);
			return { jsonrpc: "2.0", id, method: "eth_estimateGas", params };
		}

		case "EthGetBlockByNumber":
			return {
				jsonrpc: "2.0",
				id,
				method: "eth_getBlockByNumber",
				params: [request.blockTag, request.includeTransactions],
			};

		case "EthGetBlockByHash":
			return {
				jsonrpc: "2.0",
				id,
				method: "eth_getBlockByHash",
				params: [request.blockHash, request.includeTransactions],
			};

		case "EthGetTransactionByHash":
			return {
				jsonrpc: "2.0",
				id,
				method: "eth_getTransactionByHash",
				params: [request.hash],
			};

		case "EthGetTransactionReceipt":
			return {
				jsonrpc: "2.0",
				id,
				method: "eth_getTransactionReceipt",
				params: [request.hash],
			};

		case "EthGetLogs": {
			const filter: Record<string, unknown> = {};
			if (request.address) filter.address = request.address;
			if (request.topics) filter.topics = request.topics;
			if (request.fromBlock) filter.fromBlock = request.fromBlock;
			if (request.toBlock) filter.toBlock = request.toBlock;
			if (request.blockHash) filter.blockHash = request.blockHash;
			return { jsonrpc: "2.0", id, method: "eth_getLogs", params: [filter] };
		}

		case "GenericRpcRequest":
			return {
				jsonrpc: "2.0",
				id,
				method: request.method,
				params: request.params,
			};
	}
};

/**
 * Shape of the RpcBatch service.
 *
 * @since 0.0.1
 */
export interface RpcBatchShape {
	readonly resolver: RequestResolver.RequestResolver<RpcRequest, never>;
	readonly request: <R extends RpcRequest>(
		request: R,
	) => Effect.Effect<Request.Request.Success<R>, Request.Request.Error<R>>;
}

/**
 * RpcBatch service tag.
 *
 * @since 0.0.1
 */
export class RpcBatchService extends Context.Tag("RpcBatchService")<
	RpcBatchService,
	RpcBatchShape
>() {}

/**
 * Creates a batched RPC resolver that groups requests into JSON-RPC batch calls.
 *
 * @since 0.0.1
 */
export const makeRpcResolver = (transport: {
	request: <T>(
		method: string,
		params?: unknown[],
	) => Effect.Effect<T, TransportError>;
}): RequestResolver.RequestResolver<RpcRequest, never> =>
	RequestResolver.makeBatched((requests: readonly RpcRequest[]) =>
		Effect.gen(function* () {
			if (requests.length === 0) return;

			if (requests.length === 1) {
				const request = requests[0];
				const rpcRequest = requestToRpc(request, 1);
				const result = yield* Effect.either(
					transport.request<unknown>(
						rpcRequest.method,
						rpcRequest.params as unknown[],
					),
				);
				if (result._tag === "Left") {
					const error =
						result.left instanceof TransportError
							? result.left
							: new TransportError({
									code: -32603,
									message: String(result.left),
								});
					yield* Request.fail(request, error);
				} else {
					yield* Request.succeed(request as RpcRequest, result.right);
				}
				return;
			}

			const batch = requests.map((req, idx) => requestToRpc(req, idx));

			const result = yield* Effect.either(
				transport.request<JsonRpcResponse[]>("__batch__", batch as unknown[]),
			);

			if (result._tag === "Left") {
				const error =
					result.left instanceof TransportError
						? result.left
						: new TransportError({
								code: -32603,
								message: String(result.left),
							});
				yield* Effect.forEach(
					requests,
					(request) => Request.fail(request, error),
					{ discard: true },
				);
				return;
			}

			const responses = result.right;
			const responseById = new Map(responses.map((r) => [r.id, r]));

			yield* Effect.forEach(
				requests,
				(request, idx) => {
					const response = responseById.get(idx);
					if (!response) {
						return Request.fail(
							request,
							new TransportError({
								code: -32603,
								message: `Missing response for request id ${idx}`,
							}),
						);
					}
					if (response.error) {
						return Request.fail(
							request,
							new TransportError({
								code: response.error.code,
								message: response.error.message,
								data: response.error.data,
							}),
						);
					}
					return Request.succeed(request as RpcRequest, response.result);
				},
				{ discard: true },
			);
		}),
	);

/**
 * Layer that provides the RpcBatch service.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { RpcBatchService, RpcBatch, EthBlockNumber, EthGetBalance } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const batch = yield* RpcBatchService
 *
 *   // These are automatically batched when run concurrently
 *   const [blockNumber, balance] = yield* Effect.all([
 *     batch.request(new EthBlockNumber({})),
 *     batch.request(new EthGetBalance({ address: "0x...", blockTag: "latest" })),
 *   ], { concurrency: "unbounded" })
 *
 *   return { blockNumber, balance }
 * }).pipe(
 *   Effect.provide(RpcBatch),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 */
export const RpcBatch: Layer.Layer<RpcBatchService, never, TransportService> =
	Layer.effect(
		RpcBatchService,
		Effect.gen(function* () {
			const transport = yield* TransportService;
			const resolver = makeRpcResolver(transport);

			return {
				resolver,
				request: <R extends RpcRequest>(request: R) =>
					Effect.request(resolver as any)(request) as Effect.Effect<
						Request.Request.Success<R>,
						Request.Request.Error<R>
					>,
			};
		}),
	);

// Re-export request types for convenience
export type {
	EthBlockNumber,
	EthGetBalance,
	EthGetTransactionCount,
	EthChainId,
	EthGasPrice,
	EthGetCode,
	EthGetStorageAt,
	EthCall,
	EthEstimateGas,
	EthGetBlockByNumber,
	EthGetBlockByHash,
	EthGetTransactionByHash,
	EthGetTransactionReceipt,
	EthGetLogs,
	GenericRpcRequest,
	RpcRequest,
};
