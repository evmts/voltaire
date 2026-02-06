/**
 * @fileoverview Effect Schema for eth_accounts JSON-RPC method.
 * @module jsonrpc/schemas/eth/accounts
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_accounts request params schema.
 * No parameters.
 */
export const AccountsParams = S.Tuple();

/**
 * eth_accounts result schema.
 * Returns array of addresses owned by client.
 */
export const AccountsResult = S.Array(AddressHexSchema);

/**
 * eth_accounts request schema.
 */
export const AccountsRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_accounts"),
	params: S.optional(AccountsParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_accounts response schema.
 */
export const AccountsResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: AccountsResult,
});

/** Type for AccountsRequest */
export type AccountsRequestType = S.Schema.Type<typeof AccountsRequest>;

/** Type for AccountsResponse */
export type AccountsResponseType = S.Schema.Type<typeof AccountsResponse>;
