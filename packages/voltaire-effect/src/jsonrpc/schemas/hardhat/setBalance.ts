/**
 * @fileoverview Effect Schema for hardhat_setBalance JSON-RPC method.
 * @module jsonrpc/schemas/hardhat/setBalance
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
 * hardhat_setBalance request params schema.
 * [address, balance]
 */
export const SetBalanceParams = S.Tuple(AddressHexSchema, QuantityHexSchema);

/**
 * hardhat_setBalance result schema.
 * Returns true on success.
 */
export const SetBalanceResult = S.Boolean;

/**
 * hardhat_setBalance request schema.
 */
export const SetBalanceRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("hardhat_setBalance"),
	params: SetBalanceParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * hardhat_setBalance response schema.
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
