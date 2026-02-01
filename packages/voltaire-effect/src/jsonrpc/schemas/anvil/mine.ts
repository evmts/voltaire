/**
 * @fileoverview Effect Schema for anvil_mine JSON-RPC method.
 * @module jsonrpc/schemas/anvil/mine
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * anvil_mine request params schema.
 * [numBlocks?, interval?] - both optional hex quantities
 */
export const MineParams = S.Tuple(
	S.optionalElement(QuantityHexSchema),
	S.optionalElement(QuantityHexSchema),
);

/**
 * anvil_mine result schema.
 * Returns null on success.
 */
export const MineResult = S.Null;

/**
 * anvil_mine request schema.
 */
export const MineRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_mine"),
	params: S.optional(MineParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_mine response schema.
 */
export const MineResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: MineResult,
});

/** Type for MineRequest */
export type MineRequestType = S.Schema.Type<typeof MineRequest>;

/** Type for MineResponse */
export type MineResponseType = S.Schema.Type<typeof MineResponse>;
