/**
 * @fileoverview Effect Schema for anvil_setStorageAt JSON-RPC method.
 * @module jsonrpc/schemas/anvil/setStorageAt
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * anvil_setStorageAt request params schema.
 * [address, slot, value]
 */
export const SetStorageAtParams = S.Tuple(
	AddressHexSchema,
	Bytes32HexSchema,
	Bytes32HexSchema,
);

/**
 * anvil_setStorageAt result schema.
 * Returns true on success.
 */
export const SetStorageAtResult = S.Boolean;

/**
 * anvil_setStorageAt request schema.
 */
export const SetStorageAtRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_setStorageAt"),
	params: SetStorageAtParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_setStorageAt response schema.
 */
export const SetStorageAtResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SetStorageAtResult,
});

/** Type for SetStorageAtRequest */
export type SetStorageAtRequestType = S.Schema.Type<typeof SetStorageAtRequest>;

/** Type for SetStorageAtResponse */
export type SetStorageAtResponseType = S.Schema.Type<
	typeof SetStorageAtResponse
>;
