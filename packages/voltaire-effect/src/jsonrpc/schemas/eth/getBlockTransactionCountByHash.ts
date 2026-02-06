/**
 * @fileoverview Effect Schema for eth_getBlockTransactionCountByHash JSON-RPC method.
 * @module jsonrpc/schemas/eth/getBlockTransactionCountByHash
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_getBlockTransactionCountByHash request params schema.
 * [blockHash]
 */
export const GetBlockTransactionCountByHashParams = S.Tuple(Bytes32HexSchema);

/**
 * eth_getBlockTransactionCountByHash result schema.
 * Returns the transaction count or null if block not found.
 */
export const GetBlockTransactionCountByHashResult = S.NullOr(QuantityHexSchema);

/**
 * eth_getBlockTransactionCountByHash request schema.
 */
export const GetBlockTransactionCountByHashRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getBlockTransactionCountByHash"),
	params: GetBlockTransactionCountByHashParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getBlockTransactionCountByHash response schema.
 */
export const GetBlockTransactionCountByHashResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetBlockTransactionCountByHashResult,
});

/** Type for GetBlockTransactionCountByHashRequest */
export type GetBlockTransactionCountByHashRequestType = S.Schema.Type<
	typeof GetBlockTransactionCountByHashRequest
>;

/** Type for GetBlockTransactionCountByHashResponse */
export type GetBlockTransactionCountByHashResponseType = S.Schema.Type<
	typeof GetBlockTransactionCountByHashResponse
>;
