/**
 * @fileoverview Effect Schema for eth_getUncleByBlockHashAndIndex JSON-RPC method.
 * @module jsonrpc/schemas/eth/getUncleByBlockHashAndIndex
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockRpcSchema,
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_getUncleByBlockHashAndIndex request params schema.
 * [blockHash, uncleIndex]
 */
export const GetUncleByBlockHashAndIndexParams = S.Tuple(
	Bytes32HexSchema,
	QuantityHexSchema,
);

/**
 * eth_getUncleByBlockHashAndIndex result schema.
 * Returns the uncle block or null if not found.
 */
export const GetUncleByBlockHashAndIndexResult = S.NullOr(BlockRpcSchema);

/**
 * eth_getUncleByBlockHashAndIndex request schema.
 */
export const GetUncleByBlockHashAndIndexRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getUncleByBlockHashAndIndex"),
	params: GetUncleByBlockHashAndIndexParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getUncleByBlockHashAndIndex response schema.
 */
export const GetUncleByBlockHashAndIndexResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetUncleByBlockHashAndIndexResult,
});

/** Type for GetUncleByBlockHashAndIndexRequest */
export type GetUncleByBlockHashAndIndexRequestType = S.Schema.Type<
	typeof GetUncleByBlockHashAndIndexRequest
>;

/** Type for GetUncleByBlockHashAndIndexResponse */
export type GetUncleByBlockHashAndIndexResponseType = S.Schema.Type<
	typeof GetUncleByBlockHashAndIndexResponse
>;
