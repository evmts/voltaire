/**
 * @fileoverview Effect Schema for txpool_content JSON-RPC method.
 * @module jsonrpc/schemas/txpool/content
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	TransactionRpcSchema,
} from "../common.js";

/**
 * txpool_content request params schema.
 * No parameters.
 */
export const ContentParams = S.Tuple();

/**
 * Transaction map by nonce.
 * Maps nonce (decimal string) to transaction object.
 */
export const TransactionsByNonceSchema = S.Record({
	key: S.String,
	value: TransactionRpcSchema,
});

/**
 * Transaction map by address.
 * Maps address to nonce-keyed transactions.
 */
export const TransactionsByAddressSchema = S.Record({
	key: S.String,
	value: TransactionsByNonceSchema,
});

/**
 * txpool_content result schema.
 * Returns full transaction objects grouped by pending/queued and address.
 */
export const ContentResult = S.Struct({
	pending: TransactionsByAddressSchema,
	queued: TransactionsByAddressSchema,
});

/**
 * txpool_content request schema.
 */
export const ContentRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("txpool_content"),
	params: S.optional(ContentParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * txpool_content response schema.
 */
export const ContentResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: ContentResult,
});

/** Type for ContentRequest */
export type ContentRequestType = S.Schema.Type<typeof ContentRequest>;

/** Type for ContentResponse */
export type ContentResponseType = S.Schema.Type<typeof ContentResponse>;
