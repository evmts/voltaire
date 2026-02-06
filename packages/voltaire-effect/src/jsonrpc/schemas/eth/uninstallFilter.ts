/**
 * @fileoverview Effect Schema for eth_uninstallFilter JSON-RPC method.
 * @module jsonrpc/schemas/eth/uninstallFilter
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_uninstallFilter request params schema.
 * [filterId]
 */
export const UninstallFilterParams = S.Tuple(QuantityHexSchema);

/**
 * eth_uninstallFilter result schema.
 * Returns true if filter was successfully uninstalled, false otherwise.
 */
export const UninstallFilterResult = S.Boolean;

/**
 * eth_uninstallFilter request schema.
 */
export const UninstallFilterRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_uninstallFilter"),
	params: UninstallFilterParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_uninstallFilter response schema.
 */
export const UninstallFilterResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: UninstallFilterResult,
});

/** Type for UninstallFilterRequest */
export type UninstallFilterRequestType = S.Schema.Type<
	typeof UninstallFilterRequest
>;

/** Type for UninstallFilterResponse */
export type UninstallFilterResponseType = S.Schema.Type<
	typeof UninstallFilterResponse
>;
