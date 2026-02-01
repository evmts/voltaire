/**
 * @fileoverview Effect Schema for wallet_sendCalls JSON-RPC method.
 * @see EIP-5792: https://eips.ethereum.org/EIPS/eip-5792
 * @module jsonrpc/schemas/wallet/sendCalls
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * Call object schema for wallet_sendCalls.
 */
export const WalletCall = S.Struct({
	to: AddressHexSchema,
	data: S.optional(HexSchema),
	value: S.optional(QuantityHexSchema),
});

/** Type for WalletCall */
export type WalletCallType = S.Schema.Type<typeof WalletCall>;

/**
 * Send calls parameter schema.
 * @see EIP-5792
 */
export const SendCallsParameter = S.Struct({
	version: S.String,
	chainId: QuantityHexSchema,
	from: AddressHexSchema,
	calls: S.Array(WalletCall),
	capabilities: S.optional(S.Record({ key: S.String, value: S.Unknown })),
});

/** Type for SendCallsParameter */
export type SendCallsParameterType = S.Schema.Type<typeof SendCallsParameter>;

/**
 * wallet_sendCalls request params schema.
 * [sendCallsParameter]
 */
export const SendCallsParams = S.Tuple(SendCallsParameter);

/**
 * wallet_sendCalls result schema.
 * Returns a bundle identifier string.
 */
export const SendCallsResult = S.String;

/**
 * wallet_sendCalls request schema.
 */
export const SendCallsRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_sendCalls"),
	params: SendCallsParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_sendCalls response schema.
 */
export const SendCallsResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SendCallsResult,
});

/** Type for SendCallsRequest */
export type SendCallsRequestType = S.Schema.Type<typeof SendCallsRequest>;

/** Type for SendCallsResponse */
export type SendCallsResponseType = S.Schema.Type<typeof SendCallsResponse>;
