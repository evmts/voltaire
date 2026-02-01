/**
 * @fileoverview Effect Schema for anvil_setNonce JSON-RPC method.
 * @module jsonrpc/schemas/anvil/setNonce
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * anvil_setNonce request params schema.
 * [address, nonce]
 */
export const SetNonceParams = S.Tuple(AddressHexSchema, QuantityHexSchema);

/**
 * anvil_setNonce result schema.
 * Returns null on success.
 */
export const SetNonceResult = S.Null;

/**
 * anvil_setNonce request schema.
 */
export const SetNonceRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_setNonce"),
	params: SetNonceParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_setNonce response schema.
 */
export const SetNonceResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SetNonceResult,
});

/** Type for SetNonceRequest */
export type SetNonceRequestType = S.Schema.Type<typeof SetNonceRequest>;

/** Type for SetNonceResponse */
export type SetNonceResponseType = S.Schema.Type<typeof SetNonceResponse>;
