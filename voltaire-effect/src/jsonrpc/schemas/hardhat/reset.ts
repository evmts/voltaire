/**
 * @fileoverview Effect Schema for hardhat_reset JSON-RPC method.
 * @module jsonrpc/schemas/hardhat/reset
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * Fork config for hardhat_reset.
 */
export const ForkConfigSchema = S.Struct({
	jsonRpcUrl: S.optional(S.String),
	blockNumber: S.optional(S.Number),
});

/**
 * hardhat_reset request params schema.
 * [forkConfig?] - optional fork configuration
 */
export const ResetParams = S.Tuple(S.optionalElement(ForkConfigSchema));

/**
 * hardhat_reset result schema.
 * Returns true on success.
 */
export const ResetResult = S.Boolean;

/**
 * hardhat_reset request schema.
 */
export const ResetRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("hardhat_reset"),
	params: S.optional(ResetParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * hardhat_reset response schema.
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
