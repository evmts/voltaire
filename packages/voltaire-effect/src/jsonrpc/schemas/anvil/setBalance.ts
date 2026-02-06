/**
 * @fileoverview Effect Schema for anvil_setBalance JSON-RPC method.
 * @module jsonrpc/schemas/anvil/setBalance
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * anvil_setBalance request params schema.
 * [address, balance]
 */
export const SetBalanceParams = S.Tuple(AddressHexSchema, QuantityHexSchema);

/**
 * anvil_setBalance result schema.
 * Returns null on success.
 */
export const SetBalanceResult = S.Null;

/**
 * anvil_setBalance request schema.
 */
export const SetBalanceRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_setBalance"),
	params: SetBalanceParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_setBalance response schema.
 */
export const SetBalanceResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SetBalanceResult,
});

/** Type for SetBalanceRequest */
export type SetBalanceRequestType = S.Schema.Type<typeof SetBalanceRequest>;

/** Type for SetBalanceResponse */
export type SetBalanceResponseType = S.Schema.Type<typeof SetBalanceResponse>;
