/**
 * @fileoverview Effect Schema for web3_sha3 JSON-RPC method.
 * @module jsonrpc/schemas/web3/sha3
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
 * web3_sha3 request params schema.
 * [data] - hex-encoded data to hash.
 */
export const Sha3Params = S.Tuple(HexSchema);

/**
 * web3_sha3 result schema.
 * Returns the Keccak-256 hash of the given data.
 */
export const Sha3Result = Bytes32HexSchema;

/**
 * web3_sha3 request schema.
 */
export const Sha3Request = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("web3_sha3"),
	params: Sha3Params,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * web3_sha3 response schema.
 */
export const Sha3Response = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: Sha3Result,
});

/** Type for Sha3Request */
export type Sha3RequestType = S.Schema.Type<typeof Sha3Request>;

/** Type for Sha3Response */
export type Sha3ResponseType = S.Schema.Type<typeof Sha3Response>;
