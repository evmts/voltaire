/**
 * @fileoverview Effect Schema for net_listening JSON-RPC method.
 * @module jsonrpc/schemas/net/listening
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * net_listening request params schema.
 * No parameters.
 */
export const ListeningParams = S.Tuple();

/**
 * net_listening result schema.
 * Returns true if client is actively listening for network connections.
 */
export const ListeningResult = S.Boolean;

/**
 * net_listening request schema.
 */
export const ListeningRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("net_listening"),
	params: S.optional(ListeningParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * net_listening response schema.
 */
export const ListeningResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: ListeningResult,
});

/** Type for ListeningRequest */
export type ListeningRequestType = S.Schema.Type<typeof ListeningRequest>;

/** Type for ListeningResponse */
export type ListeningResponseType = S.Schema.Type<typeof ListeningResponse>;
