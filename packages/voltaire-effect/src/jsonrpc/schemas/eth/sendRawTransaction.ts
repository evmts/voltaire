/**
 * @fileoverview Effect Schema for eth_sendRawTransaction JSON-RPC method.
 * @module jsonrpc/schemas/eth/sendRawTransaction
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_sendRawTransaction request params schema.
 * [signedTransactionData]
 */
export const SendRawTransactionParams = S.Tuple(HexSchema);

/**
 * eth_sendRawTransaction result schema.
 * Returns the transaction hash.
 */
export const SendRawTransactionResult = Bytes32HexSchema;

/**
 * eth_sendRawTransaction request schema.
 */
export const SendRawTransactionRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_sendRawTransaction"),
	params: SendRawTransactionParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_sendRawTransaction response schema.
 */
export const SendRawTransactionResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SendRawTransactionResult,
});

/** Type for SendRawTransactionRequest */
export type SendRawTransactionRequestType = S.Schema.Type<
	typeof SendRawTransactionRequest
>;

/** Type for SendRawTransactionResponse */
export type SendRawTransactionResponseType = S.Schema.Type<
	typeof SendRawTransactionResponse
>;
