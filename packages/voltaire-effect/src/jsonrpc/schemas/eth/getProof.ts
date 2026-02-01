/**
 * @fileoverview Effect Schema for eth_getProof JSON-RPC method.
 * @module jsonrpc/schemas/eth/getProof
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AccountProofRpcSchema,
	AddressHexSchema,
	BlockTagSchema,
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_getProof request params schema.
 * [address, storageKeys, blockTag]
 */
export const GetProofParams = S.Tuple(
	AddressHexSchema,
	S.Array(Bytes32HexSchema),
	BlockTagSchema,
);

/**
 * eth_getProof result schema.
 * Returns the account and storage proof.
 */
export const GetProofResult = AccountProofRpcSchema;

/**
 * eth_getProof request schema.
 */
export const GetProofRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getProof"),
	params: GetProofParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getProof response schema.
 */
export const GetProofResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetProofResult,
});

/** Type for GetProofRequest */
export type GetProofRequestType = S.Schema.Type<typeof GetProofRequest>;

/** Type for GetProofResponse */
export type GetProofResponseType = S.Schema.Type<typeof GetProofResponse>;
