/**
 * @fileoverview Effect Schema for eth_sign JSON-RPC method.
 * @module jsonrpc/schemas/eth/sign
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_sign request params schema.
 * [address, message]
 */
export const SignParams = S.Tuple(AddressHexSchema, HexSchema);

/**
 * eth_sign result schema.
 * Returns the signature as hex.
 */
export const SignResult = HexSchema;

/**
 * eth_sign request schema.
 */
export const SignRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_sign"),
	params: SignParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_sign response schema.
 */
export const SignResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SignResult,
});

/** Type for SignRequest */
export type SignRequestType = S.Schema.Type<typeof SignRequest>;

/** Type for SignResponse */
export type SignResponseType = S.Schema.Type<typeof SignResponse>;
