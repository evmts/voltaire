/**
 * @fileoverview Effect Schema for eth_blockNumber JSON-RPC method.
 * @module jsonrpc/schemas/eth/blockNumber
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_blockNumber request params schema.
 * No parameters.
 */
export const BlockNumberParams = S.Tuple();

/**
 * eth_blockNumber result schema.
 * Returns the current block number as hex.
 */
export const BlockNumberResult = QuantityHexSchema;

/**
 * eth_blockNumber request schema.
 */
export const BlockNumberRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_blockNumber"),
	params: S.optional(BlockNumberParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_blockNumber response schema.
 */
export const BlockNumberResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: BlockNumberResult,
});

/** Type for BlockNumberRequest */
export type BlockNumberRequestType = S.Schema.Type<typeof BlockNumberRequest>;

/** Type for BlockNumberResponse */
export type BlockNumberResponseType = S.Schema.Type<typeof BlockNumberResponse>;
