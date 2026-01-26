/**
 * @fileoverview Effect Schema for anvil_stopImpersonatingAccount JSON-RPC method.
 * @module jsonrpc/schemas/anvil/stopImpersonatingAccount
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * anvil_stopImpersonatingAccount request params schema.
 * [address]
 */
export const StopImpersonatingAccountParams = S.Tuple(AddressHexSchema);

/**
 * anvil_stopImpersonatingAccount result schema.
 * Returns null on success.
 */
export const StopImpersonatingAccountResult = S.Null;

/**
 * anvil_stopImpersonatingAccount request schema.
 */
export const StopImpersonatingAccountRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_stopImpersonatingAccount"),
	params: StopImpersonatingAccountParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_stopImpersonatingAccount response schema.
 */
export const StopImpersonatingAccountResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: StopImpersonatingAccountResult,
});

/** Type for StopImpersonatingAccountRequest */
export type StopImpersonatingAccountRequestType = S.Schema.Type<
	typeof StopImpersonatingAccountRequest
>;

/** Type for StopImpersonatingAccountResponse */
export type StopImpersonatingAccountResponseType = S.Schema.Type<
	typeof StopImpersonatingAccountResponse
>;
