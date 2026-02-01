/**
 * @fileoverview Effect Schema for hardhat_dropTransaction JSON-RPC method.
 * @module jsonrpc/schemas/hardhat/dropTransaction
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	Bytes32HexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * hardhat_dropTransaction request params schema.
 * [txHash]
 */
export const DropTransactionParams = S.Tuple(Bytes32HexSchema);

/**
 * hardhat_dropTransaction result schema.
 * Returns true if tx was dropped.
 */
export const DropTransactionResult = S.Boolean;

/**
 * hardhat_dropTransaction request schema.
 */
export const DropTransactionRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("hardhat_dropTransaction"),
	params: DropTransactionParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * hardhat_dropTransaction response schema.
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
