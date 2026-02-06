/**
 * @fileoverview Effect Schema for eth_getTransactionByHash JSON-RPC method.
 * @module jsonrpc/schemas/eth/getTransactionByHash
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	TransactionRpcSchema,
} from "../common.js";

/**
 * eth_getTransactionByHash request params schema.
 * [transactionHash]
 */
export const GetTransactionByHashParams = S.Tuple(Bytes32HexSchema);

/**
 * eth_getTransactionByHash result schema.
 * Returns the transaction or null if not found.
 */
export const GetTransactionByHashResult = S.NullOr(TransactionRpcSchema);

/**
 * eth_getTransactionByHash request schema.
 */
export const GetTransactionByHashRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getTransactionByHash"),
	params: GetTransactionByHashParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getTransactionByHash response schema.
 */
export const GetTransactionByHashResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetTransactionByHashResult,
});

/** Type for GetTransactionByHashRequest */
export type GetTransactionByHashRequestType = S.Schema.Type<
	typeof GetTransactionByHashRequest
>;

/** Type for GetTransactionByHashResponse */
export type GetTransactionByHashResponseType = S.Schema.Type<
	typeof GetTransactionByHashResponse
>;
