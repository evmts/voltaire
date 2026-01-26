/**
 * @fileoverview Effect Schema for eth_getTransactionReceipt JSON-RPC method.
 * @module jsonrpc/schemas/eth/getTransactionReceipt
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	ReceiptRpcSchema,
} from "../common.js";

/**
 * eth_getTransactionReceipt request params schema.
 * [transactionHash]
 */
export const GetTransactionReceiptParams = S.Tuple(Bytes32HexSchema);

/**
 * eth_getTransactionReceipt result schema.
 * Returns the receipt or null if not found/pending.
 */
export const GetTransactionReceiptResult = S.NullOr(ReceiptRpcSchema);

/**
 * eth_getTransactionReceipt request schema.
 */
export const GetTransactionReceiptRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getTransactionReceipt"),
	params: GetTransactionReceiptParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getTransactionReceipt response schema.
 */
export const GetTransactionReceiptResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetTransactionReceiptResult,
});

/** Type for GetTransactionReceiptRequest */
export type GetTransactionReceiptRequestType = S.Schema.Type<
	typeof GetTransactionReceiptRequest
>;

/** Type for GetTransactionReceiptResponse */
export type GetTransactionReceiptResponseType = S.Schema.Type<
	typeof GetTransactionReceiptResponse
>;
