/**
 * @fileoverview Effect Schema for eth_newFilter JSON-RPC method.
 * @module jsonrpc/schemas/eth/newFilter
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	LogFilterSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_newFilter request params schema.
 * [filter]
 */
export const NewFilterParams = S.Tuple(LogFilterSchema);

/**
 * eth_newFilter result schema.
 * Returns a filter id as hex quantity.
 */
export const NewFilterResult = QuantityHexSchema;

/**
 * eth_newFilter request schema.
 */
export const NewFilterRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_newFilter"),
	params: NewFilterParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_newFilter response schema.
 */
export const NewFilterResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: NewFilterResult,
});

/** Type for NewFilterRequest */
export type NewFilterRequestType = S.Schema.Type<typeof NewFilterRequest>;

/** Type for NewFilterResponse */
export type NewFilterResponseType = S.Schema.Type<typeof NewFilterResponse>;
