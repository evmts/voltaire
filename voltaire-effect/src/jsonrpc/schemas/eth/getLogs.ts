/**
 * @fileoverview Effect Schema for eth_getLogs JSON-RPC method.
 * @module jsonrpc/schemas/eth/getLogs
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	LogFilterSchema,
	LogRpcSchema,
} from "../common.js";

/**
 * eth_getLogs request params schema.
 * [filter]
 */
export const GetLogsParams = S.Tuple(LogFilterSchema);

/**
 * eth_getLogs result schema.
 * Returns an array of log objects.
 */
export const GetLogsResult = S.Array(LogRpcSchema);

/**
 * eth_getLogs request schema.
 */
export const GetLogsRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getLogs"),
	params: GetLogsParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getLogs response schema.
 */
export const GetLogsResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetLogsResult,
});

/** Type for GetLogsRequest */
export type GetLogsRequestType = S.Schema.Type<typeof GetLogsRequest>;

/** Type for GetLogsResponse */
export type GetLogsResponseType = S.Schema.Type<typeof GetLogsResponse>;
