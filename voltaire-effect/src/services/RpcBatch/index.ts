/**
 * @fileoverview RpcBatch module for Effect-idiomatic request batching.
 *
 * @module RpcBatch
 * @since 0.0.1
 *
 * @description
 * Provides Effect's Request/RequestResolver pattern for automatic JSON-RPC
 * request batching and deduplication. This is a more idiomatic Effect approach
 * compared to the manual BatchScheduler.
 *
 * Key features:
 * - Automatic batching via Effect.request
 * - Request deduplication (identical requests return same result)
 * - Per-request error handling
 * - Type-safe request/response mapping
 *
 * @example Basic usage
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   RpcBatchService,
 *   RpcBatch,
 *   EthBlockNumber,
 *   EthGetBalance,
 *   HttpTransport
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const batch = yield* RpcBatchService
 *
 *   // These are automatically batched into a single RPC call
 *   const [blockNumber, balance1, balance2] = yield* Effect.all([
 *     batch.request(new EthBlockNumber({})),
 *     batch.request(new EthGetBalance({ address: addr1, blockTag: "latest" })),
 *     batch.request(new EthGetBalance({ address: addr2, blockTag: "latest" })),
 *   ], { concurrency: "unbounded" })
 *
 *   return { blockNumber, balance1, balance2 }
 * }).pipe(
 *   Effect.provide(RpcBatch),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @example Deduplication - identical requests share the same response
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const batch = yield* RpcBatchService
 *
 *   // Same request twice - only one RPC call is made
 *   const [balance1, balance2] = yield* Effect.all([
 *     batch.request(new EthGetBalance({ address: addr, blockTag: "latest" })),
 *     batch.request(new EthGetBalance({ address: addr, blockTag: "latest" })),
 *   ], { concurrency: "unbounded" })
 *
 *   // balance1 === balance2 (same result, shared)
 * })
 * ```
 */

// Request types
export {
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
	type RpcRequest,
} from "./RpcRequest.js";

// Resolver and service
export {
	makeRpcResolver,
	RpcBatch,
	RpcBatchService,
	type RpcBatchShape,
} from "./RpcResolver.js";
