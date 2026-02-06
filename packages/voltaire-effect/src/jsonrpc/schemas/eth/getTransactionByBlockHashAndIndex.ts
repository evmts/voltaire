/**
 * @fileoverview Effect Schema for eth_getTransactionByBlockHashAndIndex JSON-RPC method.
 * @module jsonrpc/schemas/eth/getTransactionByBlockHashAndIndex
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
	TransactionRpcSchema,
} from "../common.js";

/**
 * eth_getTransactionByBlockHashAndIndex request params schema.
 * [blockHash, transactionIndex]
 */
export const GetTransactionByBlockHashAndIndexParams = S.Tuple(
	Bytes32HexSchema,
	QuantityHexSchema,
);

/**
 * eth_getTransactionByBlockHashAndIndex result schema.
 * Returns the transaction or null if not found.
 */
export const GetTransactionByBlockHashAndIndexResult =
	S.NullOr(TransactionRpcSchema);

/**
 * eth_getTransactionByBlockHashAndIndex request schema.
 */
export const GetTransactionByBlockHashAndIndexRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getTransactionByBlockHashAndIndex"),
	params: GetTransactionByBlockHashAndIndexParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getTransactionByBlockHashAndIndex response schema.
 */
export const GetTransactionByBlockHashAndIndexResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetTransactionByBlockHashAndIndexResult,
});

/** Type for GetTransactionByBlockHashAndIndexRequest */
export type GetTransactionByBlockHashAndIndexRequestType = S.Schema.Type<
	typeof GetTransactionByBlockHashAndIndexRequest
>;

/** Type for GetTransactionByBlockHashAndIndexResponse */
export type GetTransactionByBlockHashAndIndexResponseType = S.Schema.Type<
	typeof GetTransactionByBlockHashAndIndexResponse
>;
