/**
 * @fileoverview Effect Schema for eth_getUncleByBlockNumberAndIndex JSON-RPC method.
 * @module jsonrpc/schemas/eth/getUncleByBlockNumberAndIndex
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockRpcSchema,
	BlockTagSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_getUncleByBlockNumberAndIndex request params schema.
 * [blockTag, uncleIndex]
 */
export const GetUncleByBlockNumberAndIndexParams = S.Tuple(
	BlockTagSchema,
	QuantityHexSchema,
);

/**
 * eth_getUncleByBlockNumberAndIndex result schema.
 * Returns the uncle block or null if not found.
 */
export const GetUncleByBlockNumberAndIndexResult = S.NullOr(BlockRpcSchema);

/**
 * eth_getUncleByBlockNumberAndIndex request schema.
 */
export const GetUncleByBlockNumberAndIndexRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getUncleByBlockNumberAndIndex"),
	params: GetUncleByBlockNumberAndIndexParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getUncleByBlockNumberAndIndex response schema.
 */
export const GetUncleByBlockNumberAndIndexResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetUncleByBlockNumberAndIndexResult,
});

/** Type for GetUncleByBlockNumberAndIndexRequest */
export type GetUncleByBlockNumberAndIndexRequestType = S.Schema.Type<
	typeof GetUncleByBlockNumberAndIndexRequest
>;

/** Type for GetUncleByBlockNumberAndIndexResponse */
export type GetUncleByBlockNumberAndIndexResponseType = S.Schema.Type<
	typeof GetUncleByBlockNumberAndIndexResponse
>;
