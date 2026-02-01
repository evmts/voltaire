/**
 * @fileoverview Effect Schema for net_peerCount JSON-RPC method.
 * @module jsonrpc/schemas/net/peerCount
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * net_peerCount request params schema.
 * No parameters.
 */
export const PeerCountParams = S.Tuple();

/**
 * net_peerCount result schema.
 * Returns the number of connected peers as hex.
 */
export const PeerCountResult = QuantityHexSchema;

/**
 * net_peerCount request schema.
 */
export const PeerCountRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("net_peerCount"),
	params: S.optional(PeerCountParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * net_peerCount response schema.
 */
export const PeerCountResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: PeerCountResult,
});

/** Type for PeerCountRequest */
export type PeerCountRequestType = S.Schema.Type<typeof PeerCountRequest>;

/** Type for PeerCountResponse */
export type PeerCountResponseType = S.Schema.Type<typeof PeerCountResponse>;
