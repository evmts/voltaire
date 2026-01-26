/**
 * @fileoverview Effect Schema for eth_feeHistory JSON-RPC method.
 * @module jsonrpc/schemas/eth/feeHistory
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockTagSchema,
	FeeHistoryRpcSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_feeHistory request params schema.
 * [blockCount, newestBlock, rewardPercentiles]
 */
export const FeeHistoryParams = S.Tuple(
	QuantityHexSchema,
	BlockTagSchema,
	S.optionalElement(S.Array(S.Number)),
);

/**
 * eth_feeHistory result schema.
 */
export const FeeHistoryResult = FeeHistoryRpcSchema;

/**
 * eth_feeHistory request schema.
 */
export const FeeHistoryRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_feeHistory"),
	params: FeeHistoryParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_feeHistory response schema.
 */
export const FeeHistoryResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: FeeHistoryResult,
});

/** Type for FeeHistoryRequest */
export type FeeHistoryRequestType = S.Schema.Type<typeof FeeHistoryRequest>;

/** Type for FeeHistoryResponse */
export type FeeHistoryResponseType = S.Schema.Type<typeof FeeHistoryResponse>;
