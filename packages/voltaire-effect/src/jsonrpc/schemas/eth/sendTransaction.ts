/**
 * @fileoverview Effect Schema for eth_sendTransaction JSON-RPC method.
 * @module jsonrpc/schemas/eth/sendTransaction
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	TransactionRequestSchema,
} from "../common.js";

/**
 * eth_sendTransaction request params schema.
 * [transactionRequest]
 */
export const SendTransactionParams = S.Tuple(TransactionRequestSchema);

/**
 * eth_sendTransaction result schema.
 * Returns the transaction hash.
 */
export const SendTransactionResult = Bytes32HexSchema;

/**
 * eth_sendTransaction request schema.
 */
export const SendTransactionRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_sendTransaction"),
	params: SendTransactionParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_sendTransaction response schema.
 */
export const SendTransactionResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SendTransactionResult,
});

/** Type for SendTransactionRequest */
export type SendTransactionRequestType = S.Schema.Type<
	typeof SendTransactionRequest
>;

/** Type for SendTransactionResponse */
export type SendTransactionResponseType = S.Schema.Type<
	typeof SendTransactionResponse
>;
