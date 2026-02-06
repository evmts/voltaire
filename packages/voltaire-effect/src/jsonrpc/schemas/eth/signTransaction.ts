/**
 * @fileoverview Effect Schema for eth_signTransaction JSON-RPC method.
 * @module jsonrpc/schemas/eth/signTransaction
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	TransactionRequestSchema,
} from "../common.js";

/**
 * eth_signTransaction request params schema.
 * [transactionRequest]
 */
export const SignTransactionParams = S.Tuple(TransactionRequestSchema);

/**
 * eth_signTransaction result schema.
 * Returns the signed transaction as RLP-encoded hex.
 */
export const SignTransactionResult = HexSchema;

/**
 * eth_signTransaction request schema.
 */
export const SignTransactionRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_signTransaction"),
	params: SignTransactionParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_signTransaction response schema.
 */
export const SignTransactionResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SignTransactionResult,
});

/** Type for SignTransactionRequest */
export type SignTransactionRequestType = S.Schema.Type<
	typeof SignTransactionRequest
>;

/** Type for SignTransactionResponse */
export type SignTransactionResponseType = S.Schema.Type<
	typeof SignTransactionResponse
>;
