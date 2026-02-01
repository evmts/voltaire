/**
 * @fileoverview Effect Schema for eth_getStorageAt JSON-RPC method.
 * @module jsonrpc/schemas/eth/getStorageAt
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	BlockTagSchema,
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_getStorageAt request params schema.
 * [address, storageSlot, blockTag]
 */
export const GetStorageAtParams = S.Tuple(
	AddressHexSchema,
	Bytes32HexSchema,
	BlockTagSchema,
);

/**
 * eth_getStorageAt result schema.
 * Returns the storage value at the given position.
 */
export const GetStorageAtResult = Bytes32HexSchema;

/**
 * eth_getStorageAt request schema.
 */
export const GetStorageAtRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getStorageAt"),
	params: GetStorageAtParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getStorageAt response schema.
 */
export const GetStorageAtResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetStorageAtResult,
});

/** Type for GetStorageAtRequest */
export type GetStorageAtRequestType = S.Schema.Type<typeof GetStorageAtRequest>;

/** Type for GetStorageAtResponse */
export type GetStorageAtResponseType = S.Schema.Type<
	typeof GetStorageAtResponse
>;
