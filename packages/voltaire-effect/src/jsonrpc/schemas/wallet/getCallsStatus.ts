/**
 * @fileoverview Effect Schema for wallet_getCallsStatus JSON-RPC method.
 * @see EIP-5792: https://eips.ethereum.org/EIPS/eip-5792
 * @module jsonrpc/schemas/wallet/getCallsStatus
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	LogRpcSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * Call receipt schema for getCallsStatus.
 */
export const CallReceipt = S.Struct({
	logs: S.Array(LogRpcSchema),
	status: QuantityHexSchema,
	blockHash: Bytes32HexSchema,
	blockNumber: QuantityHexSchema,
	gasUsed: QuantityHexSchema,
	transactionHash: Bytes32HexSchema,
});

/** Type for CallReceipt */
export type CallReceiptType = S.Schema.Type<typeof CallReceipt>;

/**
 * Calls status schema.
 * @see EIP-5792
 */
export const CallsStatus = S.Struct({
	status: S.Union(
		S.Literal("PENDING"),
		S.Literal("CONFIRMED"),
		// Handle numeric status codes too
		S.Number,
	),
	receipts: S.optional(S.Array(CallReceipt)),
});

/** Type for CallsStatus */
export type CallsStatusType = S.Schema.Type<typeof CallsStatus>;

/**
 * wallet_getCallsStatus request params schema.
 * [bundleId]
 */
export const GetCallsStatusParams = S.Tuple(S.String);

/**
 * wallet_getCallsStatus result schema.
 */
export const GetCallsStatusResult = CallsStatus;

/**
 * wallet_getCallsStatus request schema.
 */
export const GetCallsStatusRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_getCallsStatus"),
	params: GetCallsStatusParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_getCallsStatus response schema.
 */
export const GetCallsStatusResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetCallsStatusResult,
});

/** Type for GetCallsStatusRequest */
export type GetCallsStatusRequestType = S.Schema.Type<
	typeof GetCallsStatusRequest
>;

/** Type for GetCallsStatusResponse */
export type GetCallsStatusResponseType = S.Schema.Type<
	typeof GetCallsStatusResponse
>;
