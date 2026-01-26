/**
 * @fileoverview Effect Schema for eth_getBlockByNumber JSON-RPC method.
 * @module jsonrpc/schemas/eth/getBlockByNumber
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockRpcSchema,
	BlockTagSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_getBlockByNumber request params schema.
 * [blockNumber, fullTransactions]
 */
export const GetBlockByNumberParams = S.Tuple(BlockTagSchema, S.Boolean);

/**
 * eth_getBlockByNumber result schema.
 * Returns the block or null if not found.
 */
export const GetBlockByNumberResult = S.NullOr(BlockRpcSchema);

/**
 * eth_getBlockByNumber request schema.
 */
export const GetBlockByNumberRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getBlockByNumber"),
	params: GetBlockByNumberParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getBlockByNumber response schema.
 */
export const GetBlockByNumberResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetBlockByNumberResult,
});

/** Type for GetBlockByNumberRequest */
export type GetBlockByNumberRequestType = S.Schema.Type<
	typeof GetBlockByNumberRequest
>;

/** Type for GetBlockByNumberResponse */
export type GetBlockByNumberResponseType = S.Schema.Type<
	typeof GetBlockByNumberResponse
>;
