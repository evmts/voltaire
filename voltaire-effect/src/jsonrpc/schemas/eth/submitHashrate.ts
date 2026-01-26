/**
 * @fileoverview Effect Schema for eth_submitHashrate JSON-RPC method.
 * @module jsonrpc/schemas/eth/submitHashrate
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	Bytes32HexSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_submitHashrate request params schema.
 * [hashrate, id]
 */
export const SubmitHashrateParams = S.Tuple(
	QuantityHexSchema, // hashrate
	Bytes32HexSchema,  // id (arbitrary identifier)
);

/**
 * eth_submitHashrate result schema.
 * Returns true if submission was successful.
 */
export const SubmitHashrateResult = S.Boolean;

/**
 * eth_submitHashrate request schema.
 */
export const SubmitHashrateRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_submitHashrate"),
	params: SubmitHashrateParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_submitHashrate response schema.
 */
export const SubmitHashrateResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SubmitHashrateResult,
});

/** Type for SubmitHashrateRequest */
export type SubmitHashrateRequestType = S.Schema.Type<typeof SubmitHashrateRequest>;

/** Type for SubmitHashrateResponse */
export type SubmitHashrateResponseType = S.Schema.Type<typeof SubmitHashrateResponse>;
