/**
 * @fileoverview Effect Schema for anvil_setBlockTimestampInterval JSON-RPC method.
 * @module jsonrpc/schemas/anvil/setBlockTimestampInterval
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * anvil_setBlockTimestampInterval request params schema.
 * [seconds] - interval in seconds as number
 */
export const SetBlockTimestampIntervalParams = S.Tuple(S.Number);

/**
 * anvil_setBlockTimestampInterval result schema.
 * Returns null on success.
 */
export const SetBlockTimestampIntervalResult = S.Null;

/**
 * anvil_setBlockTimestampInterval request schema.
 */
export const SetBlockTimestampIntervalRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_setBlockTimestampInterval"),
	params: SetBlockTimestampIntervalParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_setBlockTimestampInterval response schema.
 */
export const SetBlockTimestampIntervalResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SetBlockTimestampIntervalResult,
});

/** Type for SetBlockTimestampIntervalRequest */
export type SetBlockTimestampIntervalRequestType = S.Schema.Type<
	typeof SetBlockTimestampIntervalRequest
>;

/** Type for SetBlockTimestampIntervalResponse */
export type SetBlockTimestampIntervalResponseType = S.Schema.Type<
	typeof SetBlockTimestampIntervalResponse
>;
