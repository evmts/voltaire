/**
 * @fileoverview Effect Schema for wallet_addEthereumChain JSON-RPC method.
 * @see EIP-3085: https://eips.ethereum.org/EIPS/eip-3085
 * @module jsonrpc/schemas/wallet/addEthereumChain
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * Native currency schema for chain metadata.
 */
export const NativeCurrencySchema = S.Struct({
	name: S.String,
	symbol: S.String,
	decimals: S.Number,
});

/**
 * Chain parameter schema for wallet_addEthereumChain.
 * @see EIP-3085
 */
export const AddEthereumChainParameter = S.Struct({
	chainId: QuantityHexSchema,
	chainName: S.String,
	nativeCurrency: NativeCurrencySchema,
	rpcUrls: S.Array(S.String),
	blockExplorerUrls: S.optional(S.NullOr(S.Array(S.String))),
	iconUrls: S.optional(S.Array(S.String)),
});

/** Type for AddEthereumChainParameter */
export type AddEthereumChainParameterType = S.Schema.Type<
	typeof AddEthereumChainParameter
>;

/**
 * wallet_addEthereumChain request params schema.
 * [chainParameter]
 */
export const AddEthereumChainParams = S.Tuple(AddEthereumChainParameter);

/**
 * wallet_addEthereumChain result schema.
 * Returns null on success.
 */
export const AddEthereumChainResult = S.Null;

/**
 * wallet_addEthereumChain request schema.
 */
export const AddEthereumChainRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_addEthereumChain"),
	params: AddEthereumChainParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_addEthereumChain response schema.
 */
export const AddEthereumChainResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: AddEthereumChainResult,
});

/** Type for AddEthereumChainRequest */
export type AddEthereumChainRequestType = S.Schema.Type<
	typeof AddEthereumChainRequest
>;

/** Type for AddEthereumChainResponse */
export type AddEthereumChainResponseType = S.Schema.Type<
	typeof AddEthereumChainResponse
>;
