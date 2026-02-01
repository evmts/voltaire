/**
 * @fileoverview Effect Schemas for JSON-RPC request/response validation.
 * Provides type-safe schemas for all Ethereum JSON-RPC methods.
 *
 * @module jsonrpc/schemas
 * @since 0.1.0
 */

import * as S from "effect/Schema";

// =============================================================================
// Re-export common schemas
// =============================================================================

export * from "./common.js";

// =============================================================================
// Re-export method schemas by namespace
// =============================================================================

export * as Anvil from "./anvil/index.js";
export * as Eth from "./eth/index.js";
export * as Hardhat from "./hardhat/index.js";
export * as Net from "./net/index.js";
export * as Txpool from "./txpool/index.js";
export * as Wallet from "./wallet/index.js";
export * as Web3 from "./web3/index.js";

// =============================================================================
// Import for union building
// =============================================================================

import { AnvilMethodRequest } from "./anvil/index.js";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "./common.js";
import { EthMethodRequest } from "./eth/index.js";
import { HardhatMethodRequest } from "./hardhat/index.js";
import { NetMethodRequest } from "./net/index.js";
import { TxpoolMethodRequest } from "./txpool/index.js";
import { WalletMethodRequest } from "./wallet/index.js";
import { Web3MethodRequest } from "./web3/index.js";

// =============================================================================
// Generic Fallback Request Schema
// =============================================================================

/**
 * Generic JSON-RPC request schema.
 * Use this for unknown/custom methods or when the specific method is not known.
 */
export const GenericJsonRpcRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.String,
	params: S.optional(S.Unknown),
	id: S.optional(JsonRpcIdSchema),
});

/** Type for GenericJsonRpcRequest */
export type GenericJsonRpcRequestType = S.Schema.Type<
	typeof GenericJsonRpcRequest
>;

// =============================================================================
// JSON-RPC Error Schema
// =============================================================================

/**
 * JSON-RPC error object schema.
 */
export const JsonRpcErrorSchema = S.Struct({
	code: S.Number,
	message: S.String,
	data: S.optional(S.Unknown),
});

/** Type for JsonRpcErrorSchema */
export type JsonRpcErrorType = S.Schema.Type<typeof JsonRpcErrorSchema>;

/**
 * JSON-RPC error response schema.
 */
export const JsonRpcErrorResponseSchema = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	error: JsonRpcErrorSchema,
});

/** Type for JsonRpcErrorResponseSchema */
export type JsonRpcErrorResponseType = S.Schema.Type<
	typeof JsonRpcErrorResponseSchema
>;

// =============================================================================
// Generic Response Schema
// =============================================================================

/**
 * Generic JSON-RPC success response schema.
 * Use when the result type is not known.
 * Filters out responses with an 'error' field.
 */
export const GenericJsonRpcSuccessResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: S.Unknown,
}).pipe(
	S.filter((response) => !("error" in response), {
		message: () => "Success response should not have error field",
	}),
);

/**
 * Generic JSON-RPC response schema (success or error).
 * Error responses are checked first since they have a required 'error' field.
 */
export const GenericJsonRpcResponse = S.Union(
	JsonRpcErrorResponseSchema,
	GenericJsonRpcSuccessResponse,
);

/** Type for GenericJsonRpcResponse */
export type GenericJsonRpcResponseType = S.Schema.Type<
	typeof GenericJsonRpcResponse
>;

// =============================================================================
// All Method Request Union
// =============================================================================

/**
 * Union schema for all known JSON-RPC method requests.
 * Discriminates on the `method` field.
 *
 * Currently includes:
 * - eth_* methods
 * - net_* methods
 * - txpool_* methods
 * - wallet_* methods
 * - web3_* methods
 * - anvil_* methods
 * - hardhat_* methods
 *
 * Use GenericJsonRpcRequest for unknown methods.
 */
export const JsonRpcMethodRequest = S.Union(
	EthMethodRequest,
	NetMethodRequest,
	TxpoolMethodRequest,
	WalletMethodRequest,
	Web3MethodRequest,
	AnvilMethodRequest,
	HardhatMethodRequest,
);

/** Type for JsonRpcMethodRequest union */
export type JsonRpcMethodRequestType = S.Schema.Type<
	typeof JsonRpcMethodRequest
>;

// =============================================================================
// Type-safe Request/Response Pair Utilities
// =============================================================================

/**
 * Map of method names to their result schemas.
 * Useful for type-safe response decoding.
 */
export const methodResultSchemas = {
	// eth_* methods
	eth_blockNumber: S.String,
	eth_chainId: S.String,
	eth_gasPrice: S.String,
	eth_getBalance: S.String,
	eth_getCode: S.String,
	eth_getTransactionCount: S.String,
	eth_call: S.String,
	eth_estimateGas: S.String,
	eth_sendRawTransaction: S.String,
	// net_* methods
	net_version: S.String,
	net_listening: S.Boolean,
	net_peerCount: S.String,
	// web3_* methods
	web3_clientVersion: S.String,
	web3_sha3: S.String,
	// txpool_* methods (complex results not included here)
} as const;

/**
 * Type helper for extracting the result type for a method.
 */
export type MethodResult<M extends keyof typeof methodResultSchemas> =
	S.Schema.Type<(typeof methodResultSchemas)[M]>;

// =============================================================================
// Batch Request/Response Schemas
// =============================================================================

/**
 * JSON-RPC batch request schema.
 * Array of individual requests.
 */
export const JsonRpcBatchRequest = S.Array(GenericJsonRpcRequest);

/** Type for JsonRpcBatchRequest */
export type JsonRpcBatchRequestType = S.Schema.Type<typeof JsonRpcBatchRequest>;

/**
 * JSON-RPC batch response schema.
 * Array of individual responses.
 */
export const JsonRpcBatchResponse = S.Array(GenericJsonRpcResponse);

/** Type for JsonRpcBatchResponse */
export type JsonRpcBatchResponseType = S.Schema.Type<
	typeof JsonRpcBatchResponse
>;

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Decode an unknown value as a JSON-RPC request.
 * Tries typed schemas first, falls back to generic.
 */
export const decodeRequest = S.decodeUnknown(
	S.Union(JsonRpcMethodRequest, GenericJsonRpcRequest),
);

/**
 * Decode an unknown value as a JSON-RPC response.
 */
export const decodeResponse = S.decodeUnknown(GenericJsonRpcResponse);

/**
 * Check if a value is a valid JSON-RPC request.
 */
export const isValidRequest = S.is(GenericJsonRpcRequest);

/**
 * Check if a value is a valid JSON-RPC response.
 */
export const isValidResponse = S.is(GenericJsonRpcResponse);

/**
 * Check if a response is an error response.
 */
export const isErrorResponse = (
	response: GenericJsonRpcResponseType,
): response is JsonRpcErrorResponseType => {
	return (
		typeof response === "object" &&
		response !== null &&
		"error" in response &&
		response.error !== undefined
	);
};

/**
 * Check if a response is a success response.
 */
export const isSuccessResponse = (
	response: GenericJsonRpcResponseType,
): response is S.Schema.Type<typeof GenericJsonRpcSuccessResponse> => {
	return (
		typeof response === "object" &&
		response !== null &&
		"result" in response &&
		!("error" in response)
	);
};
