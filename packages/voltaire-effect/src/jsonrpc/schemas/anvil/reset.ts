/**
 * @fileoverview Effect Schema for anvil_reset JSON-RPC method.
 * @module jsonrpc/schemas/anvil/reset
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * Fork config for anvil_reset.
 */
export const ForkConfigSchema = S.Struct({
	jsonRpcUrl: S.optional(S.String),
	blockNumber: S.optional(QuantityHexSchema),
});

/**
 * anvil_reset request params schema.
 * [forkConfig?] - optional fork configuration
 */
export const ResetParams = S.Tuple(S.optionalElement(ForkConfigSchema));

/**
 * anvil_reset result schema.
 * Returns null on success.
 */
export const ResetResult = S.Null;

/**
 * anvil_reset request schema.
 */
export const ResetRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_reset"),
	params: S.optional(ResetParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_reset response schema.
 */
export const ResetResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: ResetResult,
});

/** Type for ResetRequest */
export type ResetRequestType = S.Schema.Type<typeof ResetRequest>;

/** Type for ResetResponse */
export type ResetResponseType = S.Schema.Type<typeof ResetResponse>;
