/**
 * @fileoverview Effect Schema for wallet_getCapabilities JSON-RPC method.
 * @see EIP-5792: https://eips.ethereum.org/EIPS/eip-5792
 * @module jsonrpc/schemas/wallet/getCapabilities
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
 * Capability value schema.
 * Capability details vary by capability type.
 */
export const CapabilityValue = S.Record({
	key: S.String,
	value: S.Unknown,
});

/**
 * Chain capabilities schema.
 * Maps capability names to their configuration.
 */
export const ChainCapabilities = S.Record({
	key: S.String,
	value: CapabilityValue,
});

/** Type for ChainCapabilities */
export type ChainCapabilitiesType = S.Schema.Type<typeof ChainCapabilities>;

/**
 * wallet_getCapabilities request params schema.
 * [address] or [address, chainIds]
 */
export const GetCapabilitiesParams = S.Union(
	S.Tuple(AddressHexSchema),
	S.Tuple(AddressHexSchema, S.Array(QuantityHexSchema)),
);

/**
 * wallet_getCapabilities result schema.
 * Maps chainId hex strings to their capabilities.
 */
export const GetCapabilitiesResult = S.Record({
	key: QuantityHexSchema,
	value: ChainCapabilities,
});

/** Type for GetCapabilitiesResult */
export type GetCapabilitiesResultType = S.Schema.Type<
	typeof GetCapabilitiesResult
>;

/**
 * wallet_getCapabilities request schema.
 */
export const GetCapabilitiesRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_getCapabilities"),
	params: GetCapabilitiesParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_getCapabilities response schema.
 */
export const GetCapabilitiesResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: GetCapabilitiesResult,
});

/** Type for GetCapabilitiesRequest */
export type GetCapabilitiesRequestType = S.Schema.Type<
	typeof GetCapabilitiesRequest
>;

/** Type for GetCapabilitiesResponse */
export type GetCapabilitiesResponseType = S.Schema.Type<
	typeof GetCapabilitiesResponse
>;
