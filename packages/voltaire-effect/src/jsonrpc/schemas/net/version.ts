/**
 * @fileoverview Effect Schema for net_version JSON-RPC method.
 * @module jsonrpc/schemas/net/version
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * net_version request params schema.
 * No parameters.
 */
export const VersionParams = S.Tuple();

/**
 * net_version result schema.
 * Returns the current network id as a decimal string.
 */
export const VersionResult = S.String;

/**
 * net_version request schema.
 */
export const VersionRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("net_version"),
	params: S.optional(VersionParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * net_version response schema.
 */
export const VersionResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: VersionResult,
});

/** Type for VersionRequest */
export type VersionRequestType = S.Schema.Type<typeof VersionRequest>;

/** Type for VersionResponse */
export type VersionResponseType = S.Schema.Type<typeof VersionResponse>;
