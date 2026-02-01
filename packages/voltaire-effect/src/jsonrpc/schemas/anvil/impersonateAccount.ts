/**
 * @fileoverview Effect Schema for anvil_impersonateAccount JSON-RPC method.
 * @module jsonrpc/schemas/anvil/impersonateAccount
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * anvil_impersonateAccount request params schema.
 * [address]
 */
export const ImpersonateAccountParams = S.Tuple(AddressHexSchema);

/**
 * anvil_impersonateAccount result schema.
 * Returns null on success.
 */
export const ImpersonateAccountResult = S.Null;

/**
 * anvil_impersonateAccount request schema.
 */
export const ImpersonateAccountRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_impersonateAccount"),
	params: ImpersonateAccountParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_impersonateAccount response schema.
 */
export const ImpersonateAccountResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: ImpersonateAccountResult,
});

/** Type for ImpersonateAccountRequest */
export type ImpersonateAccountRequestType = S.Schema.Type<
	typeof ImpersonateAccountRequest
>;

/** Type for ImpersonateAccountResponse */
export type ImpersonateAccountResponseType = S.Schema.Type<
	typeof ImpersonateAccountResponse
>;
