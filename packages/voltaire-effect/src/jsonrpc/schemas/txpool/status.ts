/**
 * @fileoverview Effect Schema for txpool_status JSON-RPC method.
 * @module jsonrpc/schemas/txpool/status
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * txpool_status request params schema.
 * No parameters.
 */
export const StatusParams = S.Tuple();

/**
 * txpool_status result schema.
 * Returns the number of pending and queued transactions.
 */
export const StatusResult = S.Struct({
	pending: QuantityHexSchema,
	queued: QuantityHexSchema,
});

/**
 * txpool_status request schema.
 */
export const StatusRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("txpool_status"),
	params: S.optional(StatusParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * txpool_status response schema.
 */
export const StatusResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: StatusResult,
});

/** Type for StatusRequest */
export type StatusRequestType = S.Schema.Type<typeof StatusRequest>;

/** Type for StatusResponse */
export type StatusResponseType = S.Schema.Type<typeof StatusResponse>;
