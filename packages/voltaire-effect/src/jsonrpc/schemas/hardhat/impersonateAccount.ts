/**
 * @fileoverview Effect Schema for hardhat_impersonateAccount JSON-RPC method.
 * @module jsonrpc/schemas/hardhat/impersonateAccount
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * hardhat_impersonateAccount request params schema.
 * [address]
 */
export const ImpersonateAccountParams = S.Tuple(AddressHexSchema);

/**
 * hardhat_impersonateAccount result schema.
 * Returns true on success.
 */
export const ImpersonateAccountResult = S.Boolean;

/**
 * hardhat_impersonateAccount request schema.
 */
export const ImpersonateAccountRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("hardhat_impersonateAccount"),
	params: ImpersonateAccountParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * hardhat_impersonateAccount response schema.
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
