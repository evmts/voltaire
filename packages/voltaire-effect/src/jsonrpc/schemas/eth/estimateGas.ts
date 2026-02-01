/**
 * @fileoverview Effect Schema for eth_estimateGas JSON-RPC method.
 * @module jsonrpc/schemas/eth/estimateGas
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockTagSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
	StateOverrideSetSchema,
	TransactionRequestSchema,
} from "../common.js";

/**
 * eth_estimateGas request params schema.
 * [transaction, blockTag?, stateOverride?]
 */
export const EstimateGasParams = S.Union(
	// Minimal: [tx]
	S.Tuple(TransactionRequestSchema),
	// With block tag: [tx, blockTag]
	S.Tuple(TransactionRequestSchema, BlockTagSchema),
	// With state override: [tx, blockTag, stateOverride]
	S.Tuple(TransactionRequestSchema, BlockTagSchema, StateOverrideSetSchema),
);

/**
 * eth_estimateGas result schema.
 * Returns the estimated gas as hex.
 */
export const EstimateGasResult = QuantityHexSchema;

/**
 * eth_estimateGas request schema.
 */
export const EstimateGasRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_estimateGas"),
	params: EstimateGasParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_estimateGas response schema.
 */
export const EstimateGasResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: EstimateGasResult,
});

/** Type for EstimateGasRequest */
export type EstimateGasRequestType = S.Schema.Type<typeof EstimateGasRequest>;

/** Type for EstimateGasResponse */
export type EstimateGasResponseType = S.Schema.Type<typeof EstimateGasResponse>;
