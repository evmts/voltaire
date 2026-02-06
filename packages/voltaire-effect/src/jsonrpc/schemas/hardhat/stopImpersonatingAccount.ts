/**
 * @fileoverview Effect Schema for hardhat_stopImpersonatingAccount JSON-RPC method.
 * @module jsonrpc/schemas/hardhat/stopImpersonatingAccount
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * hardhat_stopImpersonatingAccount request params schema.
 * [address]
 */
export const StopImpersonatingAccountParams = S.Tuple(AddressHexSchema);

/**
 * hardhat_stopImpersonatingAccount result schema.
 * Returns true on success.
 */
export const StopImpersonatingAccountResult = S.Boolean;

/**
 * hardhat_stopImpersonatingAccount request schema.
 */
export const StopImpersonatingAccountRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("hardhat_stopImpersonatingAccount"),
	params: StopImpersonatingAccountParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * hardhat_stopImpersonatingAccount response schema.
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
