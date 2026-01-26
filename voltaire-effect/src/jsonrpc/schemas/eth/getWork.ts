/**
 * @fileoverview Effect Schema for eth_getWork JSON-RPC method.
 * @module jsonrpc/schemas/eth/getWork
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	Bytes32HexSchema,
	HexSchema,
} from "../common.js";

/**
 * eth_getWork request params schema.
 * No parameters.
 */
export const GetWorkParams = S.Tuple();

/**
 * eth_getWork result schema.
 * Returns [powHash, seedHash, target] for mining.
 */
export const GetWorkResult = S.Tuple(
	Bytes32HexSchema, // powHash
	Bytes32HexSchema, // seedHash
	Bytes32HexSchema, // target
);

/**
 * eth_getWork request schema.
 */
export const GetWorkRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getWork"),
	params: S.optional(GetWorkParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getWork response schema.
 */
export const GetWorkResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetWorkResult,
});

/** Type for GetWorkRequest */
export type GetWorkRequestType = S.Schema.Type<typeof GetWorkRequest>;

/** Type for GetWorkResponse */
export type GetWorkResponseType = S.Schema.Type<typeof GetWorkResponse>;
