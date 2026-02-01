/**
 * @fileoverview Effect Schema for wallet_requestPermissions JSON-RPC method.
 * @see EIP-2255: https://eips.ethereum.org/EIPS/eip-2255
 * @module jsonrpc/schemas/wallet/requestPermissions
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * Permission caveat schema.
 */
export const PermissionCaveat = S.Struct({
	type: S.String,
	value: S.Unknown,
});

/** Type for PermissionCaveat */
export type PermissionCaveatType = S.Schema.Type<typeof PermissionCaveat>;

/**
 * Permission schema for wallet permissions.
 */
export const Permission = S.Struct({
	parentCapability: S.String,
	invoker: S.optional(S.String),
	caveats: S.optional(S.Array(PermissionCaveat)),
	date: S.optional(S.Number),
});

/** Type for Permission */
export type PermissionType = S.Schema.Type<typeof Permission>;

/**
 * Requested permission schema.
 * Keys are permission names, values are empty objects or caveats.
 */
export const RequestedPermissions = S.Record({
	key: S.String,
	value: S.Struct({}),
});

/** Type for RequestedPermissions */
export type RequestedPermissionsType = S.Schema.Type<
	typeof RequestedPermissions
>;

/**
 * wallet_requestPermissions request params schema.
 * [requestedPermissions]
 */
export const RequestPermissionsParams = S.Tuple(RequestedPermissions);

/**
 * wallet_requestPermissions result schema.
 * Returns array of granted permissions.
 */
export const RequestPermissionsResult = S.Array(Permission);

/**
 * wallet_requestPermissions request schema.
 */
export const RequestPermissionsRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_requestPermissions"),
	params: RequestPermissionsParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_requestPermissions response schema.
 */
export const RequestPermissionsResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: RequestPermissionsResult,
});

/** Type for RequestPermissionsRequest */
export type RequestPermissionsRequestType = S.Schema.Type<
	typeof RequestPermissionsRequest
>;

/** Type for RequestPermissionsResponse */
export type RequestPermissionsResponseType = S.Schema.Type<
	typeof RequestPermissionsResponse
>;
