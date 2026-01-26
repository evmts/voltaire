/**
 * @fileoverview Request types for RPC batching using Effect's Request pattern.
 *
 * @module RpcRequest
 * @since 0.0.1
 *
 * @description
 * Defines Request types for common Ethereum JSON-RPC calls. These are used with
 * Effect's RequestResolver for automatic batching and deduplication.
 *
 * @see {@link RpcResolver} - The resolver that batches these requests
 */

import * as Data from "effect/Data";
import type * as Request from "effect/Request";
import type { TransportError } from "../Transport/TransportError.js";

/**
 * Request to get the current block number.
 *
 * @since 0.0.1
 */
export class EthBlockNumber extends Data.TaggedClass("EthBlockNumber")<object> {}
export interface EthBlockNumber
	extends Request.Request<string, TransportError> {}

/**
 * Request to get the balance of an address.
 *
 * @since 0.0.1
 */
export class EthGetBalance extends Data.TaggedClass("EthGetBalance")<{
	readonly address: string;
	readonly blockTag: string;
}> {}
export interface EthGetBalance
	extends Request.Request<string, TransportError> {}

/**
 * Request to get the transaction count (nonce) of an address.
 *
 * @since 0.0.1
 */
export class EthGetTransactionCount extends Data.TaggedClass(
	"EthGetTransactionCount",
)<{
	readonly address: string;
	readonly blockTag: string;
}> {}
export interface EthGetTransactionCount
	extends Request.Request<string, TransportError> {}

/**
 * Request to get the chain ID.
 *
 * @since 0.0.1
 */
export class EthChainId extends Data.TaggedClass("EthChainId")<object> {}
export interface EthChainId extends Request.Request<string, TransportError> {}

/**
 * Request to get the gas price.
 *
 * @since 0.0.1
 */
export class EthGasPrice extends Data.TaggedClass("EthGasPrice")<object> {}
export interface EthGasPrice extends Request.Request<string, TransportError> {}

/**
 * Request to get the code at an address.
 *
 * @since 0.0.1
 */
export class EthGetCode extends Data.TaggedClass("EthGetCode")<{
	readonly address: string;
	readonly blockTag: string;
}> {}
export interface EthGetCode extends Request.Request<string, TransportError> {}

/**
 * Request to get storage at a position.
 *
 * @since 0.0.1
 */
export class EthGetStorageAt extends Data.TaggedClass("EthGetStorageAt")<{
	readonly address: string;
	readonly position: string;
	readonly blockTag: string;
}> {}
export interface EthGetStorageAt
	extends Request.Request<string, TransportError> {}

/**
 * Request to execute a call (eth_call).
 *
 * @since 0.0.1
 */
export class EthCall extends Data.TaggedClass("EthCall")<{
	readonly to: string;
	readonly data?: string;
	readonly from?: string;
	readonly gas?: string;
	readonly gasPrice?: string;
	readonly value?: string;
	readonly blockTag: string;
}> {}
export interface EthCall extends Request.Request<string, TransportError> {}

/**
 * Request to estimate gas.
 *
 * @since 0.0.1
 */
export class EthEstimateGas extends Data.TaggedClass("EthEstimateGas")<{
	readonly to?: string;
	readonly data?: string;
	readonly from?: string;
	readonly gas?: string;
	readonly gasPrice?: string;
	readonly value?: string;
	readonly blockTag?: string;
}> {}
export interface EthEstimateGas
	extends Request.Request<string, TransportError> {}

/**
 * Request to get a block by number.
 *
 * @since 0.0.1
 */
export class EthGetBlockByNumber extends Data.TaggedClass(
	"EthGetBlockByNumber",
)<{
	readonly blockTag: string;
	readonly includeTransactions: boolean;
}> {}
export interface EthGetBlockByNumber
	extends Request.Request<unknown, TransportError> {}

/**
 * Request to get a block by hash.
 *
 * @since 0.0.1
 */
export class EthGetBlockByHash extends Data.TaggedClass("EthGetBlockByHash")<{
	readonly blockHash: string;
	readonly includeTransactions: boolean;
}> {}
export interface EthGetBlockByHash
	extends Request.Request<unknown, TransportError> {}

/**
 * Request to get a transaction by hash.
 *
 * @since 0.0.1
 */
export class EthGetTransactionByHash extends Data.TaggedClass(
	"EthGetTransactionByHash",
)<{
	readonly hash: string;
}> {}
export interface EthGetTransactionByHash
	extends Request.Request<unknown, TransportError> {}

/**
 * Request to get a transaction receipt.
 *
 * @since 0.0.1
 */
export class EthGetTransactionReceipt extends Data.TaggedClass(
	"EthGetTransactionReceipt",
)<{
	readonly hash: string;
}> {}
export interface EthGetTransactionReceipt
	extends Request.Request<unknown, TransportError> {}

/**
 * Request to get logs.
 *
 * @since 0.0.1
 */
export class EthGetLogs extends Data.TaggedClass("EthGetLogs")<{
	readonly address?: string | readonly string[];
	readonly topics?: readonly (string | readonly string[] | null)[];
	readonly fromBlock?: string;
	readonly toBlock?: string;
	readonly blockHash?: string;
}> {}
export interface EthGetLogs
	extends Request.Request<readonly unknown[], TransportError> {}

/**
 * Generic RPC request for methods not covered by typed requests.
 *
 * @since 0.0.1
 */
export class GenericRpcRequest extends Data.TaggedClass("GenericRpcRequest")<{
	readonly method: string;
	readonly params: readonly unknown[];
}> {}
export interface GenericRpcRequest
	extends Request.Request<unknown, TransportError> {}

/**
 * Union type of all RPC request types.
 *
 * @since 0.0.1
 */
export type RpcRequest =
	| EthBlockNumber
	| EthGetBalance
	| EthGetTransactionCount
	| EthChainId
	| EthGasPrice
	| EthGetCode
	| EthGetStorageAt
	| EthCall
	| EthEstimateGas
	| EthGetBlockByNumber
	| EthGetBlockByHash
	| EthGetTransactionByHash
	| EthGetTransactionReceipt
	| EthGetLogs
	| GenericRpcRequest;
