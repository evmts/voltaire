/**
 * @fileoverview Effect Schema for eth_newPendingTransactionFilter JSON-RPC method.
 * @module jsonrpc/schemas/eth/newPendingTransactionFilter
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_newPendingTransactionFilter request params schema.
 * No parameters.
 */
export const NewPendingTransactionFilterParams = S.Tuple();

/**
 * eth_newPendingTransactionFilter result schema.
 * Returns a filter id as hex quantity.
 */
export const NewPendingTransactionFilterResult = QuantityHexSchema;

/**
 * eth_newPendingTransactionFilter request schema.
 */
export const NewPendingTransactionFilterRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_newPendingTransactionFilter"),
	params: S.optional(NewPendingTransactionFilterParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_newPendingTransactionFilter response schema.
 */
export const NewPendingTransactionFilterResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: NewPendingTransactionFilterResult,
});

/** Type for NewPendingTransactionFilterRequest */
export type NewPendingTransactionFilterRequestType = S.Schema.Type<
	typeof NewPendingTransactionFilterRequest
>;

/** Type for NewPendingTransactionFilterResponse */
export type NewPendingTransactionFilterResponseType = S.Schema.Type<
	typeof NewPendingTransactionFilterResponse
>;
