/**
 * @fileoverview Effect Schema for eth_newBlockFilter JSON-RPC method.
 * @module jsonrpc/schemas/eth/newBlockFilter
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_newBlockFilter request params schema.
 * No parameters.
 */
export const NewBlockFilterParams = S.Tuple();

/**
 * eth_newBlockFilter result schema.
 * Returns a filter id as hex quantity.
 */
export const NewBlockFilterResult = QuantityHexSchema;

/**
 * eth_newBlockFilter request schema.
 */
export const NewBlockFilterRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_newBlockFilter"),
	params: S.optional(NewBlockFilterParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_newBlockFilter response schema.
 */
export const NewBlockFilterResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: NewBlockFilterResult,
});

/** Type for NewBlockFilterRequest */
export type NewBlockFilterRequestType = S.Schema.Type<
	typeof NewBlockFilterRequest
>;

/** Type for NewBlockFilterResponse */
export type NewBlockFilterResponseType = S.Schema.Type<
	typeof NewBlockFilterResponse
>;
