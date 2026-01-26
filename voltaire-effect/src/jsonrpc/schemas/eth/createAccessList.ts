/**
 * @fileoverview Effect Schema for eth_createAccessList JSON-RPC method.
 * @module jsonrpc/schemas/eth/createAccessList
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	BlockTagSchema,
	TransactionRequestSchema,
	AccessListResultRpcSchema,
} from "../common.js";

/**
 * eth_createAccessList request params schema.
 * [transactionRequest, blockTag]
 */
export const CreateAccessListParams = S.Tuple(
	TransactionRequestSchema,
	S.optionalElement(BlockTagSchema),
);

/**
 * eth_createAccessList result schema.
 */
export const CreateAccessListResult = AccessListResultRpcSchema;

/**
 * eth_createAccessList request schema.
 */
export const CreateAccessListRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("eth_createAccessList"),
	params: CreateAccessListParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * eth_createAccessList response schema.
 */
export const CreateAccessListResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: CreateAccessListResult,
});

/** Type for CreateAccessListRequest */
export type CreateAccessListRequestType = S.Schema.Type<typeof CreateAccessListRequest>;

/** Type for CreateAccessListResponse */
export type CreateAccessListResponseType = S.Schema.Type<typeof CreateAccessListResponse>;
