/**
 * @fileoverview Effect Schema for anvil_dropTransaction JSON-RPC method.
 * @module jsonrpc/schemas/anvil/dropTransaction
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * anvil_dropTransaction request params schema.
 * [txHash]
 */
export const DropTransactionParams = S.Tuple(Bytes32HexSchema);

/**
 * anvil_dropTransaction result schema.
 * Returns true if tx was dropped, false if not found.
 */
export const DropTransactionResult = S.NullOr(S.Boolean);

/**
 * anvil_dropTransaction request schema.
 */
export const DropTransactionRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("anvil_dropTransaction"),
	params: DropTransactionParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * anvil_dropTransaction response schema.
 */
export const DropTransactionResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: DropTransactionResult,
});

/** Type for DropTransactionRequest */
export type DropTransactionRequestType = S.Schema.Type<
	typeof DropTransactionRequest
>;

/** Type for DropTransactionResponse */
export type DropTransactionResponseType = S.Schema.Type<
	typeof DropTransactionResponse
>;
