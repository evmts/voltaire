/**
 * @fileoverview Effect Schema for eth_getBlockReceipts JSON-RPC method.
 * @module jsonrpc/schemas/eth/getBlockReceipts
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockTagSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	ReceiptRpcSchema,
} from "../common.js";

/**
 * eth_getBlockReceipts request params schema.
 * [blockNumber]
 */
export const GetBlockReceiptsParams = S.Tuple(BlockTagSchema);

/**
 * eth_getBlockReceipts result schema.
 * Returns array of receipts or null if block not found.
 */
export const GetBlockReceiptsResult = S.NullOr(S.Array(ReceiptRpcSchema));

/**
 * eth_getBlockReceipts request schema.
 */
export const GetBlockReceiptsRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getBlockReceipts"),
	params: GetBlockReceiptsParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getBlockReceipts response schema.
 */
export const GetBlockReceiptsResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetBlockReceiptsResult,
});

/** Type for GetBlockReceiptsRequest */
export type GetBlockReceiptsRequestType = S.Schema.Type<
	typeof GetBlockReceiptsRequest
>;

/** Type for GetBlockReceiptsResponse */
export type GetBlockReceiptsResponseType = S.Schema.Type<
	typeof GetBlockReceiptsResponse
>;
