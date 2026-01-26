/**
 * @fileoverview Effect Schema for eth_subscribe JSON-RPC method.
 * @module jsonrpc/schemas/eth/subscribe
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
 * Subscription type for newHeads.
 */
export const SubscribeNewHeadsParams = S.Tuple(S.Literal("newHeads"));

/**
 * Subscription type for logs without filter.
 */
export const SubscribeLogsParamsNoFilter = S.Tuple(S.Literal("logs"));

/**
 * Subscription type for logs with filter.
 */
export const SubscribeLogsParamsWithFilter = S.Tuple(
	S.Literal("logs"),
	LogFilterSchema,
);

/**
 * Subscription type for newPendingTransactions.
 */
export const SubscribeNewPendingTransactionsParams = S.Tuple(
	S.Literal("newPendingTransactions"),
);

/**
 * Subscription type for syncing.
 */
export const SubscribeSyncingParams = S.Tuple(S.Literal("syncing"));

/**
 * eth_subscribe request params schema.
 * Params vary by subscription type.
 */
export const SubscribeParams = S.Union(
	SubscribeNewHeadsParams,
	SubscribeLogsParamsNoFilter,
	SubscribeLogsParamsWithFilter,
	SubscribeNewPendingTransactionsParams,
	SubscribeSyncingParams,
);

/**
 * eth_subscribe result schema.
 * Returns a subscription id as hex quantity.
 */
export const SubscribeResult = QuantityHexSchema;

/**
 * eth_subscribe request schema.
 */
export const SubscribeRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_subscribe"),
	params: SubscribeParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_subscribe response schema.
 */
export const SubscribeResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SubscribeResult,
});

/** Type for SubscribeRequest */
export type SubscribeRequestType = S.Schema.Type<typeof SubscribeRequest>;

/** Type for SubscribeResponse */
export type SubscribeResponseType = S.Schema.Type<typeof SubscribeResponse>;
