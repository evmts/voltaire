/**
 * @fileoverview Effect Schema for eth_getBlockByHash JSON-RPC method.
 * @module jsonrpc/schemas/eth/getBlockByHash
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockRpcSchema,
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_getBlockByHash request params schema.
 * [blockHash, fullTransactions]
 */
export const GetBlockByHashParams = S.Tuple(Bytes32HexSchema, S.Boolean);

/**
 * eth_getBlockByHash result schema.
 * Returns the block or null if not found.
 */
export const GetBlockByHashResult = S.NullOr(BlockRpcSchema);

/**
 * eth_getBlockByHash request schema.
 */
export const GetBlockByHashRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getBlockByHash"),
	params: GetBlockByHashParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getBlockByHash response schema.
 */
export const GetBlockByHashResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetBlockByHashResult,
});

/** Type for GetBlockByHashRequest */
export type GetBlockByHashRequestType = S.Schema.Type<
	typeof GetBlockByHashRequest
>;

/** Type for GetBlockByHashResponse */
export type GetBlockByHashResponseType = S.Schema.Type<
	typeof GetBlockByHashResponse
>;
