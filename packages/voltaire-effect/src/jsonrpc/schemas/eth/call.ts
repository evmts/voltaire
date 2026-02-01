/**
 * @fileoverview Effect Schema for eth_call JSON-RPC method.
 * @module jsonrpc/schemas/eth/call
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	BlockOverrideSchema,
	BlockTagSchema,
	HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	StateOverrideSetSchema,
	TransactionRequestSchema,
} from "../common.js";

/**
 * eth_call request params schema.
 * [transaction, blockTag, stateOverride?, blockOverrides?]
 *
 * The params array can have 2-4 elements:
 * - Required: transaction object, block tag
 * - Optional: state override set, block overrides
 */
export const CallParams = S.Union(
	// Minimal: [tx, blockTag]
	S.Tuple(TransactionRequestSchema, BlockTagSchema),
	// With state override: [tx, blockTag, stateOverride]
	S.Tuple(TransactionRequestSchema, BlockTagSchema, StateOverrideSetSchema),
	// Full: [tx, blockTag, stateOverride, blockOverrides]
	S.Tuple(
		TransactionRequestSchema,
		BlockTagSchema,
		StateOverrideSetSchema,
		BlockOverrideSchema,
	),
);

/**
 * eth_call result schema.
 * Returns the return data as hex.
 */
export const CallResult = HexSchema;

/**
 * eth_call request schema.
 */
export const CallRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_call"),
	params: CallParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_call response schema.
 */
export const CallResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: CallResult,
});

/** Type for CallRequest */
export type CallRequestType = S.Schema.Type<typeof CallRequest>;

/** Type for CallResponse */
export type CallResponseType = S.Schema.Type<typeof CallResponse>;
