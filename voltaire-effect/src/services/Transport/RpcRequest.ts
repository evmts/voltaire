/**
 * @fileoverview Effect.Request types for JSON-RPC batching.
 *
 * @module RpcRequest
 * @since 0.0.1
 *
 * @description
 * Provides Effect.Request types for common Ethereum JSON-RPC methods.
 * These can be used with RequestResolver for automatic batching.
 *
 * @see {@link RpcResolver} - The resolver that batches these requests
 * @see {@link TransportService} - The underlying transport
 */

import * as Data from "effect/Data";

/**
 * Block tag type for block-related requests.
 *
 * @since 0.0.1
 */
export type BlockTag = "latest" | "earliest" | "pending" | "safe" | "finalized" | string;

/**
 * Call params interface.
 *
 * @since 0.0.1
 */
export interface CallParams {
	readonly from?: string;
	readonly to: string;
	readonly gas?: string;
	readonly gasPrice?: string;
	readonly value?: string;
	readonly data?: string;
	readonly maxFeePerGas?: string;
	readonly maxPriorityFeePerGas?: string;
}

/**
 * Log filter interface.
 *
 * @since 0.0.1
 */
export interface LogFilter {
	readonly address?: string | string[];
	readonly topics?: (string | string[] | null)[];
	readonly fromBlock?: BlockTag;
	readonly toBlock?: BlockTag;
	readonly blockHash?: string;
}

/**
 * Get block number request.
 * @since 0.0.1
 */
export class GetBlockNumber extends Data.TaggedClass("GetBlockNumber")<{}> {}

/**
 * Get chain ID request.
 * @since 0.0.1
 */
export class GetChainId extends Data.TaggedClass("GetChainId")<{}> {}

/**
 * Get gas price request.
 * @since 0.0.1
 */
export class GetGasPrice extends Data.TaggedClass("GetGasPrice")<{}> {}

/**
 * Get balance request.
 * @since 0.0.1
 */
export class GetBalance extends Data.TaggedClass("GetBalance")<{
	readonly address: string;
	readonly blockTag: BlockTag;
}> {}

/**
 * Get transaction count (nonce) request.
 * @since 0.0.1
 */
export class GetTransactionCount extends Data.TaggedClass("GetTransactionCount")<{
	readonly address: string;
	readonly blockTag: BlockTag;
}> {}

/**
 * Get code request.
 * @since 0.0.1
 */
export class GetCode extends Data.TaggedClass("GetCode")<{
	readonly address: string;
	readonly blockTag: BlockTag;
}> {}

/**
 * Get storage at request.
 * @since 0.0.1
 */
export class GetStorageAt extends Data.TaggedClass("GetStorageAt")<{
	readonly address: string;
	readonly slot: string;
	readonly blockTag: BlockTag;
}> {}

/**
 * Call request.
 * @since 0.0.1
 */
export class Call extends Data.TaggedClass("Call")<{
	readonly params: CallParams;
	readonly blockTag: BlockTag;
}> {}

/**
 * Estimate gas request.
 * @since 0.0.1
 */
export class EstimateGas extends Data.TaggedClass("EstimateGas")<{
	readonly params: CallParams;
	readonly blockTag?: BlockTag;
}> {}

/**
 * Get block by number request.
 * @since 0.0.1
 */
export class GetBlockByNumber extends Data.TaggedClass("GetBlockByNumber")<{
	readonly blockTag: BlockTag;
	readonly includeTransactions: boolean;
}> {}

/**
 * Get block by hash request.
 * @since 0.0.1
 */
export class GetBlockByHash extends Data.TaggedClass("GetBlockByHash")<{
	readonly blockHash: string;
	readonly includeTransactions: boolean;
}> {}

/**
 * Get transaction by hash request.
 * @since 0.0.1
 */
export class GetTransactionByHash extends Data.TaggedClass("GetTransactionByHash")<{
	readonly hash: string;
}> {}

/**
 * Get transaction receipt request.
 * @since 0.0.1
 */
export class GetTransactionReceipt extends Data.TaggedClass("GetTransactionReceipt")<{
	readonly hash: string;
}> {}

/**
 * Get logs request.
 * @since 0.0.1
 */
export class GetLogs extends Data.TaggedClass("GetLogs")<{
	readonly filter: LogFilter;
}> {}

/**
 * Send raw transaction request.
 * @since 0.0.1
 */
export class SendRawTransaction extends Data.TaggedClass("SendRawTransaction")<{
	readonly signedTransaction: string;
}> {}

/**
 * Get fee history request.
 * @since 0.0.1
 */
export class GetFeeHistory extends Data.TaggedClass("GetFeeHistory")<{
	readonly blockCount: number;
	readonly newestBlock: BlockTag;
	readonly rewardPercentiles: number[];
}> {}

/**
 * Generic RPC request for methods not covered by specific types.
 * @since 0.0.1
 */
export class GenericRpcRequest extends Data.TaggedClass("GenericRpcRequest")<{
	readonly method: string;
	readonly params: readonly unknown[];
}> {}

/**
 * Union of all RPC request types.
 *
 * @since 0.0.1
 */
export type RpcRequest =
	| GetBlockNumber
	| GetChainId
	| GetGasPrice
	| GetBalance
	| GetTransactionCount
	| GetCode
	| GetStorageAt
	| Call
	| EstimateGas
	| GetBlockByNumber
	| GetBlockByHash
	| GetTransactionByHash
	| GetTransactionReceipt
	| GetLogs
	| SendRawTransaction
	| GetFeeHistory
	| GenericRpcRequest;

/**
 * Convert a request to JSON-RPC method and params.
 *
 * @since 0.0.1
 */
export const toJsonRpc = (request: RpcRequest): { method: string; params: unknown[] } => {
	switch (request._tag) {
		case "GetBlockNumber":
			return { method: "eth_blockNumber", params: [] };
		case "GetChainId":
			return { method: "eth_chainId", params: [] };
		case "GetGasPrice":
			return { method: "eth_gasPrice", params: [] };
		case "GetBalance":
			return { method: "eth_getBalance", params: [request.address, request.blockTag] };
		case "GetTransactionCount":
			return { method: "eth_getTransactionCount", params: [request.address, request.blockTag] };
		case "GetCode":
			return { method: "eth_getCode", params: [request.address, request.blockTag] };
		case "GetStorageAt":
			return { method: "eth_getStorageAt", params: [request.address, request.slot, request.blockTag] };
		case "Call":
			return { method: "eth_call", params: [request.params, request.blockTag] };
		case "EstimateGas":
			return request.blockTag
				? { method: "eth_estimateGas", params: [request.params, request.blockTag] }
				: { method: "eth_estimateGas", params: [request.params] };
		case "GetBlockByNumber":
			return { method: "eth_getBlockByNumber", params: [request.blockTag, request.includeTransactions] };
		case "GetBlockByHash":
			return { method: "eth_getBlockByHash", params: [request.blockHash, request.includeTransactions] };
		case "GetTransactionByHash":
			return { method: "eth_getTransactionByHash", params: [request.hash] };
		case "GetTransactionReceipt":
			return { method: "eth_getTransactionReceipt", params: [request.hash] };
		case "GetLogs":
			return { method: "eth_getLogs", params: [request.filter] };
		case "SendRawTransaction":
			return { method: "eth_sendRawTransaction", params: [request.signedTransaction] };
		case "GetFeeHistory":
			return {
				method: "eth_feeHistory",
				params: [`0x${request.blockCount.toString(16)}`, request.newestBlock, request.rewardPercentiles],
			};
		case "GenericRpcRequest":
			return { method: request.method, params: [...request.params] };
	}
};
