/**
 * @fileoverview Effect Schema for eth_getUncleCountByBlockNumber JSON-RPC method.
 * @module jsonrpc/schemas/eth/getUncleCountByBlockNumber
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
 * eth_getUncleCountByBlockNumber request params schema.
 * [blockTag]
 */
export const GetUncleCountByBlockNumberParams = S.Tuple(BlockTagSchema);

/**
 * eth_getUncleCountByBlockNumber result schema.
 * Returns the uncle count or null if block not found.
 */
export const GetUncleCountByBlockNumberResult = S.NullOr(QuantityHexSchema);

/**
 * eth_getUncleCountByBlockNumber request schema.
 */
export const GetUncleCountByBlockNumberRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getUncleCountByBlockNumber"),
	params: GetUncleCountByBlockNumberParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getUncleCountByBlockNumber response schema.
 */
export const GetUncleCountByBlockNumberResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetUncleCountByBlockNumberResult,
});

/** Type for GetUncleCountByBlockNumberRequest */
export type GetUncleCountByBlockNumberRequestType = S.Schema.Type<
	typeof GetUncleCountByBlockNumberRequest
>;

/** Type for GetUncleCountByBlockNumberResponse */
export type GetUncleCountByBlockNumberResponseType = S.Schema.Type<
	typeof GetUncleCountByBlockNumberResponse
>;
