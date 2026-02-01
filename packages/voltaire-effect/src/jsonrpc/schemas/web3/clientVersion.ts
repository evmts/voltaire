/**
 * @fileoverview Effect Schema for web3_clientVersion JSON-RPC method.
 * @module jsonrpc/schemas/web3/clientVersion
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * web3_clientVersion request params schema.
 * No parameters.
 */
export const ClientVersionParams = S.Tuple();

/**
 * web3_clientVersion result schema.
 * Returns the current client version string.
 */
export const ClientVersionResult = S.String;

/**
 * web3_clientVersion request schema.
 */
export const ClientVersionRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("web3_clientVersion"),
	params: S.optional(ClientVersionParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * web3_clientVersion response schema.
 */
export const ClientVersionResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: ClientVersionResult,
});

/** Type for ClientVersionRequest */
export type ClientVersionRequestType = S.Schema.Type<
	typeof ClientVersionRequest
>;

/** Type for ClientVersionResponse */
export type ClientVersionResponseType = S.Schema.Type<
	typeof ClientVersionResponse
>;
