/**
 * @fileoverview Effect Schema for txpool_inspect JSON-RPC method.
 * @module jsonrpc/schemas/txpool/inspect
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * txpool_inspect request params schema.
 * No parameters.
 */
export const InspectParams = S.Tuple();

/**
 * Transaction summary by nonce.
 * Maps nonce (decimal string) to transaction summary string.
 * Format: "to: value wei + gas x gasPrice gas"
 */
export const TransactionSummaryByNonceSchema = S.Record({
	key: S.String,
	value: S.String,
});

/**
 * Transaction summary by address.
 * Maps address to nonce-keyed transaction summaries.
 */
export const TransactionSummaryByAddressSchema = S.Record({
	key: S.String,
	value: TransactionSummaryByNonceSchema,
});

/**
 * txpool_inspect result schema.
 * Returns transaction summaries grouped by pending/queued and address.
 */
export const InspectResult = S.Struct({
	pending: TransactionSummaryByAddressSchema,
	queued: TransactionSummaryByAddressSchema,
});

/**
 * txpool_inspect request schema.
 */
export const InspectRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("txpool_inspect"),
	params: S.optional(InspectParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * txpool_inspect response schema.
 */
export const InspectResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: InspectResult,
});

/** Type for InspectRequest */
export type InspectRequestType = S.Schema.Type<typeof InspectRequest>;

/** Type for InspectResponse */
export type InspectResponseType = S.Schema.Type<typeof InspectResponse>;
