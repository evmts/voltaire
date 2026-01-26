/**
 * @fileoverview Effect Schema for wallet_getPermissions JSON-RPC method.
 * @see EIP-2255: https://eips.ethereum.org/EIPS/eip-2255
 * @module jsonrpc/schemas/wallet/getPermissions
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";
import { Permission } from "./requestPermissions.js";

/**
 * wallet_getPermissions request params schema.
 * No parameters.
 */
export const GetPermissionsParams = S.Tuple();

/**
 * wallet_getPermissions result schema.
 * Returns array of current permissions.
 */
export const GetPermissionsResult = S.Array(Permission);

/**
 * wallet_getPermissions request schema.
 */
export const GetPermissionsRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_getPermissions"),
	params: S.optional(GetPermissionsParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_getPermissions response schema.
 */
export const GetPermissionsResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetPermissionsResult,
});

/** Type for GetPermissionsRequest */
export type GetPermissionsRequestType = S.Schema.Type<
	typeof GetPermissionsRequest
>;

/** Type for GetPermissionsResponse */
export type GetPermissionsResponseType = S.Schema.Type<
	typeof GetPermissionsResponse
>;
