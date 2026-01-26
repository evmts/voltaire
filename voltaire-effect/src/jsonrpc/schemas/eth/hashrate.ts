/**
 * @fileoverview Effect Schema for eth_hashrate JSON-RPC method.
 * @module jsonrpc/schemas/eth/hashrate
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_hashrate request params schema.
 * No parameters.
 */
export const HashrateParams = S.Tuple();

/**
 * eth_hashrate result schema.
 * Returns number of hashes per second as hex.
 */
export const HashrateResult = QuantityHexSchema;

/**
 * eth_hashrate request schema.
 */
export const HashrateRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_hashrate"),
	params: S.optional(HashrateParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_hashrate response schema.
 */
export const HashrateResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: HashrateResult,
});

/** Type for HashrateRequest */
export type HashrateRequestType = S.Schema.Type<typeof HashrateRequest>;

/** Type for HashrateResponse */
export type HashrateResponseType = S.Schema.Type<typeof HashrateResponse>;
