/**
 * @fileoverview Effect Schema for wallet_showCallsStatus JSON-RPC method.
 * @see EIP-5792: https://eips.ethereum.org/EIPS/eip-5792
 * @module jsonrpc/schemas/wallet/showCallsStatus
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * wallet_showCallsStatus request params schema.
 * [bundleId]
 */
export const ShowCallsStatusParams = S.Tuple(S.String);

/**
 * wallet_showCallsStatus result schema.
 * Returns undefined (void).
 */
export const ShowCallsStatusResult = S.Undefined;

/**
 * wallet_showCallsStatus request schema.
 */
export const ShowCallsStatusRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_showCallsStatus"),
	params: ShowCallsStatusParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_showCallsStatus response schema.
 */
export const ShowCallsStatusResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: ShowCallsStatusResult,
});

/** Type for ShowCallsStatusRequest */
export type ShowCallsStatusRequestType = S.Schema.Type<
	typeof ShowCallsStatusRequest
>;

/** Type for ShowCallsStatusResponse */
export type ShowCallsStatusResponseType = S.Schema.Type<
	typeof ShowCallsStatusResponse
>;
