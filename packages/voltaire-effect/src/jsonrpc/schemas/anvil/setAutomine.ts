/**
 * @fileoverview Effect Schema for anvil_setAutomine JSON-RPC method.
 * @module jsonrpc/schemas/anvil/setAutomine
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * anvil_setAutomine request params schema.
 * [enabled] - boolean
 */
export const SetAutomineParams = S.Tuple(S.Boolean);

/**
 * anvil_setAutomine result schema.
 * Returns null on success.
 */
export const SetAutomineResult = S.Null;

/**
 * anvil_setAutomine request schema.
 */
export const SetAutomineRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_setAutomine"),
	params: SetAutomineParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_setAutomine response schema.
 */
export const SetAutomineResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SetAutomineResult,
});

/** Type for SetAutomineRequest */
export type SetAutomineRequestType = S.Schema.Type<typeof SetAutomineRequest>;

/** Type for SetAutomineResponse */
export type SetAutomineResponseType = S.Schema.Type<typeof SetAutomineResponse>;
