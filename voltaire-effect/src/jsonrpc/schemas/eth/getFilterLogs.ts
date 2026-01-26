/**
 * @fileoverview Effect Schema for eth_getFilterLogs JSON-RPC method.
 * @module jsonrpc/schemas/eth/getFilterLogs
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	LogRpcSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_getFilterLogs request params schema.
 * [filterId]
 */
export const GetFilterLogsParams = S.Tuple(QuantityHexSchema);

/**
 * eth_getFilterLogs result schema.
 * Returns an array of log objects.
 */
export const GetFilterLogsResult = S.Array(LogRpcSchema);

/**
 * eth_getFilterLogs request schema.
 */
export const GetFilterLogsRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getFilterLogs"),
	params: GetFilterLogsParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getFilterLogs response schema.
 */
export const GetFilterLogsResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetFilterLogsResult,
});

/** Type for GetFilterLogsRequest */
export type GetFilterLogsRequestType = S.Schema.Type<
	typeof GetFilterLogsRequest
>;

/** Type for GetFilterLogsResponse */
export type GetFilterLogsResponseType = S.Schema.Type<
	typeof GetFilterLogsResponse
>;
