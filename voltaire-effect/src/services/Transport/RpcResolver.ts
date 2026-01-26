/**
 * @fileoverview RPC request helpers for JSON-RPC batching.
 *
 * @module RpcResolver
 * @since 0.0.1
 *
 * @description
 * Provides helper functions for making RPC requests using the typed request
 * classes. These integrate with TransportService for making requests.
 *
 * @see {@link RpcRequest} - The request types
 * @see {@link TransportService} - The underlying transport
 */

import * as Effect from "effect/Effect";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";
import {
	type RpcRequest,
	toJsonRpc,
	GetBlockNumber,
	GetChainId,
	GetGasPrice,
	GetBalance,
	GetTransactionCount,
	GetCode,
	GetStorageAt,
	Call,
	EstimateGas,
	GetBlockByNumber,
	GetBlockByHash,
	GetTransactionByHash,
	GetTransactionReceipt,
	GetLogs,
	SendRawTransaction,
	GetFeeHistory,
	GenericRpcRequest,
	type CallParams,
	type LogFilter,
	type BlockTag,
} from "./RpcRequest.js";

/**
 * Make an RPC request using the transport service.
 *
 * @description
 * Converts a typed RpcRequest to a JSON-RPC call and executes it.
 *
 * @param request - The RPC request to make
 * @returns Effect that resolves to the response
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { rpcRequest, GetBlockNumber, GetBalance } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   // Single request
 *   const blockNumber = yield* rpcRequest(new GetBlockNumber())
 *
 *   // Request with params
 *   const balance = yield* rpcRequest(
 *     new GetBalance({ address: '0x...', blockTag: 'latest' })
 *   )
 *
 *   return { blockNumber, balance }
 * })
 * ```
 */
export const rpcRequest = <T = unknown>(
	request: RpcRequest,
): Effect.Effect<T, TransportError, TransportService> =>
	Effect.gen(function* () {
		const transport = yield* TransportService;
		const { method, params } = toJsonRpc(request);
		return yield* transport.request<T>(method, params);
	});

/**
 * Helper functions for common RPC requests.
 *
 * @description
 * Convenience functions for making common Ethereum JSON-RPC calls.
 * Each function returns an Effect that requires TransportService.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { rpc, HttpTransport } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const blockNumber = yield* rpc.getBlockNumber()
 *   const chainId = yield* rpc.getChainId()
 *   const balance = yield* rpc.getBalance('0x...')
 *   return { blockNumber, chainId, balance }
 * }).pipe(
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/KEY'))
 * )
 * ```
 */
export const rpc = {
	/** Get the current block number */
	getBlockNumber: () => rpcRequest<string>(new GetBlockNumber()),

	/** Get the current chain ID */
	getChainId: () => rpcRequest<string>(new GetChainId()),

	/** Get the current gas price */
	getGasPrice: () => rpcRequest<string>(new GetGasPrice()),

	/** Get balance of an address */
	getBalance: (address: string, blockTag: BlockTag = "latest") =>
		rpcRequest<string>(new GetBalance({ address, blockTag })),

	/** Get transaction count (nonce) of an address */
	getTransactionCount: (address: string, blockTag: BlockTag = "latest") =>
		rpcRequest<string>(new GetTransactionCount({ address, blockTag })),

	/** Get code at an address */
	getCode: (address: string, blockTag: BlockTag = "latest") =>
		rpcRequest<string>(new GetCode({ address, blockTag })),

	/** Get storage at a slot */
	getStorageAt: (address: string, slot: string, blockTag: BlockTag = "latest") =>
		rpcRequest<string>(new GetStorageAt({ address, slot, blockTag })),

	/** Call a contract */
	call: (params: CallParams, blockTag: BlockTag = "latest") =>
		rpcRequest<string>(new Call({ params, blockTag })),

	/** Estimate gas for a transaction */
	estimateGas: (params: CallParams, blockTag?: BlockTag) =>
		rpcRequest<string>(new EstimateGas({ params, blockTag })),

	/** Get block by number */
	getBlockByNumber: (blockTag: BlockTag = "latest", includeTransactions = false) =>
		rpcRequest<unknown>(new GetBlockByNumber({ blockTag, includeTransactions })),

	/** Get block by hash */
	getBlockByHash: (blockHash: string, includeTransactions = false) =>
		rpcRequest<unknown>(new GetBlockByHash({ blockHash, includeTransactions })),

	/** Get transaction by hash */
	getTransactionByHash: (hash: string) =>
		rpcRequest<unknown>(new GetTransactionByHash({ hash })),

	/** Get transaction receipt */
	getTransactionReceipt: (hash: string) =>
		rpcRequest<unknown>(new GetTransactionReceipt({ hash })),

	/** Get logs matching filter */
	getLogs: (filter: LogFilter) =>
		rpcRequest<unknown[]>(new GetLogs({ filter })),

	/** Send a signed transaction */
	sendRawTransaction: (signedTransaction: string) =>
		rpcRequest<string>(new SendRawTransaction({ signedTransaction })),

	/** Get fee history */
	getFeeHistory: (
		blockCount: number,
		newestBlock: BlockTag = "latest",
		rewardPercentiles: number[] = [],
	) =>
		rpcRequest<unknown>(new GetFeeHistory({ blockCount, newestBlock, rewardPercentiles })),

	/** Generic RPC request */
	generic: <T = unknown>(method: string, params: readonly unknown[] = []) =>
		rpcRequest<T>(new GenericRpcRequest({ method, params })),
} as const;
