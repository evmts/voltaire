/**
 * @fileoverview Effect Schema for eth_coinbase JSON-RPC method.
 * @module jsonrpc/schemas/eth/coinbase
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_coinbase request params schema.
 * No parameters.
 */
export const CoinbaseParams = S.Tuple();

/**
 * eth_coinbase result schema.
 * Returns the client coinbase address.
 */
export const CoinbaseResult = AddressHexSchema;

/**
 * eth_coinbase request schema.
 */
export const CoinbaseRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_coinbase"),
	params: S.optional(CoinbaseParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_coinbase response schema.
 */
export const CoinbaseResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: CoinbaseResult,
});

/** Type for CoinbaseRequest */
export type CoinbaseRequestType = S.Schema.Type<typeof CoinbaseRequest>;

/** Type for CoinbaseResponse */
export type CoinbaseResponseType = S.Schema.Type<typeof CoinbaseResponse>;
