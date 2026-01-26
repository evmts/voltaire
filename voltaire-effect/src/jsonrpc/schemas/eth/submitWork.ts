/**
 * @fileoverview Effect Schema for eth_submitWork JSON-RPC method.
 * @module jsonrpc/schemas/eth/submitWork
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_submitWork request params schema.
 * [nonce, powHash, mixDigest]
 */
export const SubmitWorkParams = S.Tuple(
	HexSchema, // nonce (8 bytes)
	Bytes32HexSchema, // powHash
	Bytes32HexSchema, // mixDigest
);

/**
 * eth_submitWork result schema.
 * Returns true if proof-of-work is valid.
 */
export const SubmitWorkResult = S.Boolean;

/**
 * eth_submitWork request schema.
 */
export const SubmitWorkRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_submitWork"),
	params: SubmitWorkParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_submitWork response schema.
 */
export const SubmitWorkResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SubmitWorkResult,
});

/** Type for SubmitWorkRequest */
export type SubmitWorkRequestType = S.Schema.Type<typeof SubmitWorkRequest>;

/** Type for SubmitWorkResponse */
export type SubmitWorkResponseType = S.Schema.Type<typeof SubmitWorkResponse>;
