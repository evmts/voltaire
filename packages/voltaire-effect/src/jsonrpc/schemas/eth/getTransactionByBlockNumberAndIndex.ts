/**
 * @fileoverview Effect Schema for eth_getTransactionByBlockNumberAndIndex JSON-RPC method.
 * @module jsonrpc/schemas/eth/getTransactionByBlockNumberAndIndex
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockTagSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
	TransactionRpcSchema,
} from "../common.js";

/**
 * eth_getTransactionByBlockNumberAndIndex request params schema.
 * [blockNumber, transactionIndex]
 */
export const GetTransactionByBlockNumberAndIndexParams = S.Tuple(
	BlockTagSchema,
	QuantityHexSchema,
);

/**
 * eth_getTransactionByBlockNumberAndIndex result schema.
 * Returns the transaction or null if not found.
 */
export const GetTransactionByBlockNumberAndIndexResult =
	S.NullOr(TransactionRpcSchema);

/**
 * eth_getTransactionByBlockNumberAndIndex request schema.
 */
export const GetTransactionByBlockNumberAndIndexRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getTransactionByBlockNumberAndIndex"),
	params: GetTransactionByBlockNumberAndIndexParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getTransactionByBlockNumberAndIndex response schema.
 */
export const GetTransactionByBlockNumberAndIndexResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetTransactionByBlockNumberAndIndexResult,
});

/** Type for GetTransactionByBlockNumberAndIndexRequest */
export type GetTransactionByBlockNumberAndIndexRequestType = S.Schema.Type<
	typeof GetTransactionByBlockNumberAndIndexRequest
>;

/** Type for GetTransactionByBlockNumberAndIndexResponse */
export type GetTransactionByBlockNumberAndIndexResponseType = S.Schema.Type<
	typeof GetTransactionByBlockNumberAndIndexResponse
>;
