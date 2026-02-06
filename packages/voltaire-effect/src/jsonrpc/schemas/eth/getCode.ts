/**
 * @fileoverview Effect Schema for eth_getCode JSON-RPC method.
 * @module jsonrpc/schemas/eth/getCode
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	BlockTagSchema,
	HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * eth_getCode request params schema.
 * [address, blockTag]
 */
export const GetCodeParams = S.Tuple(AddressHexSchema, BlockTagSchema);

/**
 * eth_getCode result schema.
 * Returns the bytecode at the address as hex.
 */
export const GetCodeResult = HexSchema;

/**
 * eth_getCode request schema.
 */
export const GetCodeRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_getCode"),
	params: GetCodeParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_getCode response schema.
 */
export const GetCodeResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetCodeResult,
});

/** Type for GetCodeRequest */
export type GetCodeRequestType = S.Schema.Type<typeof GetCodeRequest>;

/** Type for GetCodeResponse */
export type GetCodeResponseType = S.Schema.Type<typeof GetCodeResponse>;
