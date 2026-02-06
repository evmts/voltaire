/**
 * @fileoverview Effect Schema for eth_getBalance JSON-RPC method.
 * @module jsonrpc/schemas/eth/getBalance
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
 * eth_getBalance request params schema.
 * [address, blockTag]
 */
export const GetBalanceParams = S.Tuple(AddressHexSchema, BlockTagSchema);

/**
 * eth_getBalance result schema.
 * Returns the balance in wei as hex.
 */
export const GetBalanceResult = QuantityHexSchema;

/**
 * eth_getBalance request schema.
 */
export const GetBalanceRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getBalance"),
	params: GetBalanceParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getBalance response schema.
 */
export const GetBalanceResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetBalanceResult,
});

/** Type for GetBalanceRequest */
export type GetBalanceRequestType = S.Schema.Type<typeof GetBalanceRequest>;

/** Type for GetBalanceResponse */
export type GetBalanceResponseType = S.Schema.Type<typeof GetBalanceResponse>;
