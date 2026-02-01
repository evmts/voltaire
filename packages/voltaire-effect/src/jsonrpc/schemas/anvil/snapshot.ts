/**
 * @fileoverview Effect Schema for anvil_snapshot JSON-RPC method.
 * @module jsonrpc/schemas/anvil/snapshot
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * anvil_snapshot request params schema.
 * No parameters.
 */
export const SnapshotParams = S.Tuple();

/**
 * anvil_snapshot result schema.
 * Returns snapshot id as hex.
 */
export const SnapshotResult = QuantityHexSchema;

/**
 * anvil_snapshot request schema.
 */
export const SnapshotRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_snapshot"),
	params: S.optional(SnapshotParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_snapshot response schema.
 */
export const SnapshotResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SnapshotResult,
});

/** Type for SnapshotRequest */
export type SnapshotRequestType = S.Schema.Type<typeof SnapshotRequest>;

/** Type for SnapshotResponse */
export type SnapshotResponseType = S.Schema.Type<typeof SnapshotResponse>;
