/**
 * @fileoverview Effect Schema for eth_getUncleCountByBlockHash JSON-RPC method.
 * @module jsonrpc/schemas/eth/getUncleCountByBlockHash
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
 * eth_getUncleCountByBlockHash request params schema.
 * [blockHash]
 */
export const GetUncleCountByBlockHashParams = S.Tuple(Bytes32HexSchema);

/**
 * eth_getUncleCountByBlockHash result schema.
 * Returns the uncle count or null if block not found.
 */
export const GetUncleCountByBlockHashResult = S.NullOr(QuantityHexSchema);

/**
 * eth_getUncleCountByBlockHash request schema.
 */
export const GetUncleCountByBlockHashRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getUncleCountByBlockHash"),
	params: GetUncleCountByBlockHashParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getUncleCountByBlockHash response schema.
 */
export const GetUncleCountByBlockHashResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetUncleCountByBlockHashResult,
});

/** Type for GetUncleCountByBlockHashRequest */
export type GetUncleCountByBlockHashRequestType = S.Schema.Type<
	typeof GetUncleCountByBlockHashRequest
>;

/** Type for GetUncleCountByBlockHashResponse */
export type GetUncleCountByBlockHashResponseType = S.Schema.Type<
	typeof GetUncleCountByBlockHashResponse
>;
