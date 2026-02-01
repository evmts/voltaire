/**
 * @fileoverview Effect Schema for eth_getBlockTransactionCountByNumber JSON-RPC method.
 * @module jsonrpc/schemas/eth/getBlockTransactionCountByNumber
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockTagSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_getBlockTransactionCountByNumber request params schema.
 * [blockTag]
 */
export const GetBlockTransactionCountByNumberParams = S.Tuple(BlockTagSchema);

/**
 * eth_getBlockTransactionCountByNumber result schema.
 * Returns the transaction count or null if block not found.
 */
export const GetBlockTransactionCountByNumberResult =
	S.NullOr(QuantityHexSchema);

/**
 * eth_getBlockTransactionCountByNumber request schema.
 */
export const GetBlockTransactionCountByNumberRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getBlockTransactionCountByNumber"),
	params: GetBlockTransactionCountByNumberParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getBlockTransactionCountByNumber response schema.
 */
export const GetBlockTransactionCountByNumberResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetBlockTransactionCountByNumberResult,
});

/** Type for GetBlockTransactionCountByNumberRequest */
export type GetBlockTransactionCountByNumberRequestType = S.Schema.Type<
	typeof GetBlockTransactionCountByNumberRequest
>;

/** Type for GetBlockTransactionCountByNumberResponse */
export type GetBlockTransactionCountByNumberResponseType = S.Schema.Type<
	typeof GetBlockTransactionCountByNumberResponse
>;
