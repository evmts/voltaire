/**
 * @fileoverview Effect Schema for eth_maxPriorityFeePerGas JSON-RPC method.
 * @module jsonrpc/schemas/eth/maxPriorityFeePerGas
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_maxPriorityFeePerGas request params schema.
 * No parameters.
 */
export const MaxPriorityFeePerGasParams = S.Tuple();

/**
 * eth_maxPriorityFeePerGas result schema.
 * Returns suggested priority fee in wei as hex.
 */
export const MaxPriorityFeePerGasResult = QuantityHexSchema;

/**
 * eth_maxPriorityFeePerGas request schema.
 */
export const MaxPriorityFeePerGasRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_maxPriorityFeePerGas"),
	params: S.optional(MaxPriorityFeePerGasParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_maxPriorityFeePerGas response schema.
 */
export const MaxPriorityFeePerGasResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: MaxPriorityFeePerGasResult,
});

/** Type for MaxPriorityFeePerGasRequest */
export type MaxPriorityFeePerGasRequestType = S.Schema.Type<typeof MaxPriorityFeePerGasRequest>;

/** Type for MaxPriorityFeePerGasResponse */
export type MaxPriorityFeePerGasResponseType = S.Schema.Type<typeof MaxPriorityFeePerGasResponse>;
