/**
 * @fileoverview Effect Schema for anvil_revert JSON-RPC method.
 * @module jsonrpc/schemas/anvil/revert
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * anvil_revert request params schema.
 * [snapshotId]
 */
export const RevertParams = S.Tuple(QuantityHexSchema);

/**
 * anvil_revert result schema.
 * Returns true on success.
 */
export const RevertResult = S.Boolean;

/**
 * anvil_revert request schema.
 */
export const RevertRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_revert"),
	params: RevertParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_revert response schema.
 */
export const RevertResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: RevertResult,
});

/** Type for RevertRequest */
export type RevertRequestType = S.Schema.Type<typeof RevertRequest>;

/** Type for RevertResponse */
export type RevertResponseType = S.Schema.Type<typeof RevertResponse>;
