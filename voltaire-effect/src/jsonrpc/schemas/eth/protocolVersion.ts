/**
 * @fileoverview Effect Schema for eth_protocolVersion JSON-RPC method.
 * @module jsonrpc/schemas/eth/protocolVersion
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import { JsonRpcIdSchema, JsonRpcVersionSchema } from "../common.js";

/**
 * eth_protocolVersion request params schema.
 * No parameters.
 */
export const ProtocolVersionParams = S.Tuple();

/**
 * eth_protocolVersion result schema.
 * Returns current ethereum protocol version as string.
 */
export const ProtocolVersionResult = S.String;

/**
 * eth_protocolVersion request schema.
 */
export const ProtocolVersionRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_protocolVersion"),
	params: S.optional(ProtocolVersionParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_protocolVersion response schema.
 */
export const ProtocolVersionResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: ProtocolVersionResult,
});

/** Type for ProtocolVersionRequest */
export type ProtocolVersionRequestType = S.Schema.Type<
	typeof ProtocolVersionRequest
>;

/** Type for ProtocolVersionResponse */
export type ProtocolVersionResponseType = S.Schema.Type<
	typeof ProtocolVersionResponse
>;
