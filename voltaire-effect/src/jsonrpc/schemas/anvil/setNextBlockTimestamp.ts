/**
 * @fileoverview Effect Schema for anvil_setNextBlockTimestamp JSON-RPC method.
 * @module jsonrpc/schemas/anvil/setNextBlockTimestamp
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * anvil_setNextBlockTimestamp request params schema.
 * [timestamp] - Unix timestamp as hex
 */
export const SetNextBlockTimestampParams = S.Tuple(QuantityHexSchema);

/**
 * anvil_setNextBlockTimestamp result schema.
 * Returns null on success.
 */
export const SetNextBlockTimestampResult = S.Null;

/**
 * anvil_setNextBlockTimestamp request schema.
 */
export const SetNextBlockTimestampRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_setNextBlockTimestamp"),
	params: SetNextBlockTimestampParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_setNextBlockTimestamp response schema.
 */
export const SetNextBlockTimestampResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SetNextBlockTimestampResult,
});

/** Type for SetNextBlockTimestampRequest */
export type SetNextBlockTimestampRequestType = S.Schema.Type<
	typeof SetNextBlockTimestampRequest
>;

/** Type for SetNextBlockTimestampResponse */
export type SetNextBlockTimestampResponseType = S.Schema.Type<
	typeof SetNextBlockTimestampResponse
>;
