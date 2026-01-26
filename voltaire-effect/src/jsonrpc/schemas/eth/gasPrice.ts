/**
 * @fileoverview Effect Schema for eth_gasPrice JSON-RPC method.
 * @module jsonrpc/schemas/eth/gasPrice
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_gasPrice request params schema.
 * No parameters.
 */
export const GasPriceParams = S.Tuple();

/**
 * eth_gasPrice result schema.
 * Returns the current gas price in wei as hex.
 */
export const GasPriceResult = QuantityHexSchema;

/**
 * eth_gasPrice request schema.
 */
export const GasPriceRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_gasPrice"),
	params: S.optional(GasPriceParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_gasPrice response schema.
 */
export const GasPriceResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GasPriceResult,
});

/** Type for GasPriceRequest */
export type GasPriceRequestType = S.Schema.Type<typeof GasPriceRequest>;

/** Type for GasPriceResponse */
export type GasPriceResponseType = S.Schema.Type<typeof GasPriceResponse>;
