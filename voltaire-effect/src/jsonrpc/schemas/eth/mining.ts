/**
 * @fileoverview Effect Schema for eth_mining JSON-RPC method.
 * @module jsonrpc/schemas/eth/mining
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * eth_mining request params schema.
 * No parameters.
 */
export const MiningParams = S.Tuple();

/**
 * eth_mining result schema.
 * Returns true if client is actively mining.
 */
export const MiningResult = S.Boolean;

/**
 * eth_mining request schema.
 */
export const MiningRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_mining"),
	params: S.optional(MiningParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_mining response schema.
 */
export const MiningResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: MiningResult,
});

/** Type for MiningRequest */
export type MiningRequestType = S.Schema.Type<typeof MiningRequest>;

/** Type for MiningResponse */
export type MiningResponseType = S.Schema.Type<typeof MiningResponse>;
