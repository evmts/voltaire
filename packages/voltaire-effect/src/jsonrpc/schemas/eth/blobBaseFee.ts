/**
 * @fileoverview Effect Schema for eth_blobBaseFee JSON-RPC method.
 * @module jsonrpc/schemas/eth/blobBaseFee
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * eth_blobBaseFee request params schema.
 * No parameters.
 */
export const BlobBaseFeeParams = S.Tuple();

/**
 * eth_blobBaseFee result schema.
 * Returns current blob base fee in wei as hex.
 */
export const BlobBaseFeeResult = QuantityHexSchema;

/**
 * eth_blobBaseFee request schema.
 */
export const BlobBaseFeeRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_blobBaseFee"),
	params: S.optional(BlobBaseFeeParams),
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_blobBaseFee response schema.
 */
export const BlobBaseFeeResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: BlobBaseFeeResult,
});

/** Type for BlobBaseFeeRequest */
export type BlobBaseFeeRequestType = S.Schema.Type<typeof BlobBaseFeeRequest>;

/** Type for BlobBaseFeeResponse */
export type BlobBaseFeeResponseType = S.Schema.Type<typeof BlobBaseFeeResponse>;
