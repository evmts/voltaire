/**
 * @fileoverview Effect Schema for eth_syncing JSON-RPC method.
 * @module jsonrpc/schemas/eth/syncing
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	SyncStatusRpcSchema,
} from "../common.js";

/**
 * eth_syncing request params schema.
 * No parameters.
 */
export const SyncingParams = S.Tuple();

/**
 * eth_syncing result schema.
 * Returns false if not syncing, or sync status object.
 */
export const SyncingResult = SyncStatusRpcSchema;

/**
 * eth_syncing request schema.
 */
export const SyncingRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_syncing"),
	params: S.optional(SyncingParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_syncing response schema.
 */
export const SyncingResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SyncingResult,
});

/** Type for SyncingRequest */
export type SyncingRequestType = S.Schema.Type<typeof SyncingRequest>;

/** Type for SyncingResponse */
export type SyncingResponseType = S.Schema.Type<typeof SyncingResponse>;
