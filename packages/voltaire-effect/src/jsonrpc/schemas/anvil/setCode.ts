/**
 * @fileoverview Effect Schema for anvil_setCode JSON-RPC method.
 * @module jsonrpc/schemas/anvil/setCode
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
 * anvil_setCode request params schema.
 * [address, code]
 */
export const SetCodeParams = S.Tuple(AddressHexSchema, HexSchema);

/**
 * anvil_setCode result schema.
 * Returns null on success.
 */
export const SetCodeResult = S.Null;

/**
 * anvil_setCode request schema.
 */
export const SetCodeRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_setCode"),
	params: SetCodeParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_setCode response schema.
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
