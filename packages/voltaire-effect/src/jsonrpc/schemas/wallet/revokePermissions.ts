/**
 * @fileoverview Effect Schema for wallet_revokePermissions JSON-RPC method.
 * @see CAIP-25 / EIP-2255
 * @module jsonrpc/schemas/wallet/revokePermissions
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * Permissions to revoke schema.
 * Keys are permission names to revoke.
 */
export const PermissionsToRevoke = S.Record({
	key: S.String,
	value: S.Struct({}),
});

/** Type for PermissionsToRevoke */
export type PermissionsToRevokeType = S.Schema.Type<typeof PermissionsToRevoke>;

/**
 * wallet_revokePermissions request params schema.
 * [permissionsToRevoke]
 */
export const RevokePermissionsParams = S.Tuple(PermissionsToRevoke);

/**
 * wallet_revokePermissions result schema.
 * Returns null on success.
 */
export const RevokePermissionsResult = S.Null;

/**
 * wallet_revokePermissions request schema.
 */
export const RevokePermissionsRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_revokePermissions"),
	params: RevokePermissionsParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_revokePermissions response schema.
 */
export const RevokePermissionsResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: RevokePermissionsResult,
});

/** Type for RevokePermissionsRequest */
export type RevokePermissionsRequestType = S.Schema.Type<
	typeof RevokePermissionsRequest
>;

/** Type for RevokePermissionsResponse */
export type RevokePermissionsResponseType = S.Schema.Type<
	typeof RevokePermissionsResponse
>;
