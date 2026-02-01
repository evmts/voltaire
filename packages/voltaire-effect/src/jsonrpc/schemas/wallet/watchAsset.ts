/**
 * @fileoverview Effect Schema for wallet_watchAsset JSON-RPC method.
 * @see EIP-747: https://eips.ethereum.org/EIPS/eip-747
 * @module jsonrpc/schemas/wallet/watchAsset
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	AddressHexSchema,
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
} from "../common.js";

/**
 * Asset options schema for ERC-20 tokens.
 */
export const WatchAssetOptions = S.Struct({
	address: AddressHexSchema,
	symbol: S.String,
	decimals: S.Number,
	image: S.optional(S.String),
	tokenId: S.optional(S.String),
});

/** Type for WatchAssetOptions */
export type WatchAssetOptionsType = S.Schema.Type<typeof WatchAssetOptions>;

/**
 * Watch asset parameter schema.
 */
export const WatchAssetParameter = S.Struct({
	type: S.Literal("ERC20", "ERC721", "ERC1155"),
	options: WatchAssetOptions,
});

/** Type for WatchAssetParameter */
export type WatchAssetParameterType = S.Schema.Type<typeof WatchAssetParameter>;

/**
 * wallet_watchAsset request params schema.
 * The params is a single object (not array).
 */
export const WatchAssetParams = WatchAssetParameter;

/**
 * wallet_watchAsset result schema.
 * Returns true if asset was added.
 */
export const WatchAssetResult = S.Boolean;

/**
 * wallet_watchAsset request schema.
 */
export const WatchAssetRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_watchAsset"),
	params: WatchAssetParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_watchAsset response schema.
 */
export const WatchAssetResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: WatchAssetResult,
});

/** Type for WatchAssetRequest */
export type WatchAssetRequestType = S.Schema.Type<typeof WatchAssetRequest>;

/** Type for WatchAssetResponse */
export type WatchAssetResponseType = S.Schema.Type<typeof WatchAssetResponse>;
