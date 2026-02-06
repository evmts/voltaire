/**
 * @fileoverview Effect Schema for eth_unsubscribe JSON-RPC method.
 * @module jsonrpc/schemas/eth/unsubscribe
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_unsubscribe request params schema.
 * [subscriptionId]
 */
export const UnsubscribeParams = S.Tuple(QuantityHexSchema);

/**
 * eth_unsubscribe result schema.
 * Returns true if subscription was successfully cancelled.
 */
export const UnsubscribeResult = S.Boolean;

/**
 * eth_unsubscribe request schema.
 */
export const UnsubscribeRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_unsubscribe"),
	params: UnsubscribeParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_unsubscribe response schema.
 */
export const UnsubscribeResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: UnsubscribeResult,
});

/** Type for UnsubscribeRequest */
export type UnsubscribeRequestType = S.Schema.Type<typeof UnsubscribeRequest>;

/** Type for UnsubscribeResponse */
export type UnsubscribeResponseType = S.Schema.Type<typeof UnsubscribeResponse>;
