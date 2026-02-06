/**
 * @fileoverview Effect Schema for hardhat_mine JSON-RPC method.
 * @module jsonrpc/schemas/hardhat/mine
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * hardhat_mine request params schema.
 * [numBlocks?, interval?] - both optional hex quantities
 */
export const MineParams = S.Tuple(
	S.optionalElement(QuantityHexSchema),
	S.optionalElement(QuantityHexSchema),
);

/**
 * hardhat_mine result schema.
 * Returns null on success.
 */
export const MineResult = S.Null;

/**
 * hardhat_mine request schema.
 */
export const MineRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("hardhat_mine"),
	params: S.optional(MineParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * hardhat_mine response schema.
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
