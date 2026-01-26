/**
 * @fileoverview Effect Schema for eth_chainId JSON-RPC method.
 * @module jsonrpc/schemas/eth/chainId
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_chainId request params schema.
 * No parameters.
 */
export const ChainIdParams = S.Tuple();

/**
 * eth_chainId result schema.
 * Returns the chain ID as hex.
 */
export const ChainIdResult = QuantityHexSchema;

/**
 * eth_chainId request schema.
 */
export const ChainIdRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_chainId"),
	params: S.optional(ChainIdParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_chainId response schema.
 */
export const ChainIdResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: ChainIdResult,
});

/** Type for ChainIdRequest */
export type ChainIdRequestType = S.Schema.Type<typeof ChainIdRequest>;

/** Type for ChainIdResponse */
export type ChainIdResponseType = S.Schema.Type<typeof ChainIdResponse>;
