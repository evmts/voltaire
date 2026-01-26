/**
 * @fileoverview Effect Schema for eth_getFilterChanges JSON-RPC method.
 * @module jsonrpc/schemas/eth/getFilterChanges
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	LogRpcSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_getFilterChanges request params schema.
 * [filterId]
 */
export const GetFilterChangesParams = S.Tuple(QuantityHexSchema);

/**
 * eth_getFilterChanges result schema.
 * Returns array of logs (for log filters) or array of block/tx hashes (for block/pendingTx filters).
 */
export const GetFilterChangesResult = S.Union(
	S.Array(LogRpcSchema),
	S.Array(Bytes32HexSchema),
);

/**
 * eth_getFilterChanges request schema.
 */
export const GetFilterChangesRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getFilterChanges"),
	params: GetFilterChangesParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getFilterChanges response schema.
 */
export const GetFilterChangesResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetFilterChangesResult,
});

/** Type for GetFilterChangesRequest */
export type GetFilterChangesRequestType = S.Schema.Type<typeof GetFilterChangesRequest>;

/** Type for GetFilterChangesResponse */
export type GetFilterChangesResponseType = S.Schema.Type<typeof GetFilterChangesResponse>;
