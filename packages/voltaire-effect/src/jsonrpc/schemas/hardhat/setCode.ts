/**
 * @fileoverview Effect Schema for hardhat_setCode JSON-RPC method.
 * @module jsonrpc/schemas/hardhat/setCode
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
 * hardhat_setCode request params schema.
 * [address, code]
 */
export const SetCodeParams = S.Tuple(AddressHexSchema, HexSchema);

/**
 * hardhat_setCode result schema.
 * Returns true on success.
 */
export const SetCodeResult = S.Boolean;

/**
 * hardhat_setCode request schema.
 */
export const SetCodeRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("hardhat_setCode"),
	params: SetCodeParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * hardhat_setCode response schema.
 */
export const SetCodeResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SetCodeResult,
});

/** Type for SetCodeRequest */
export type SetCodeRequestType = S.Schema.Type<typeof SetCodeRequest>;

/** Type for SetCodeResponse */
export type SetCodeResponseType = S.Schema.Type<typeof SetCodeResponse>;
