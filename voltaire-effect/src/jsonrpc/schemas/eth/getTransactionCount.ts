/**
 * @fileoverview Effect Schema for eth_getTransactionCount JSON-RPC method.
 * @module jsonrpc/schemas/eth/getTransactionCount
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	BlockTagSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_getTransactionCount request params schema.
 * [address, blockTag]
 */
export const GetTransactionCountParams = S.Tuple(
	AddressHexSchema,
	BlockTagSchema,
);

/**
 * eth_getTransactionCount result schema.
 * Returns the nonce as hex.
 */
export const GetTransactionCountResult = QuantityHexSchema;

/**
 * eth_getTransactionCount request schema.
 */
export const GetTransactionCountRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getTransactionCount"),
	params: GetTransactionCountParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getTransactionCount response schema.
 */
export const GetTransactionCountResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetTransactionCountResult,
});

/** Type for GetTransactionCountRequest */
export type GetTransactionCountRequestType = S.Schema.Type<
	typeof GetTransactionCountRequest
>;

/** Type for GetTransactionCountResponse */
export type GetTransactionCountResponseType = S.Schema.Type<
	typeof GetTransactionCountResponse
>;
