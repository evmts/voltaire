/**
 * @fileoverview Effect Schema for wallet_switchEthereumChain JSON-RPC method.
 * @see EIP-3326: https://eips.ethereum.org/EIPS/eip-3326
 * @module jsonrpc/schemas/wallet/switchEthereumChain
 * @since 0.1.0
 */

import * as S from "effect/Schema";
import {
	JsonRpcIdSchema,
	JsonRpcVersionSchema,
	QuantityHexSchema,
} from "../common.js";

/**
 * Switch chain parameter schema.
 */
export const SwitchEthereumChainParameter = S.Struct({
	chainId: QuantityHexSchema,
});

/** Type for SwitchEthereumChainParameter */
export type SwitchEthereumChainParameterType = S.Schema.Type<
	typeof SwitchEthereumChainParameter
>;

/**
 * wallet_switchEthereumChain request params schema.
 * [{ chainId }]
 */
export const SwitchEthereumChainParams = S.Tuple(SwitchEthereumChainParameter);

/**
 * wallet_switchEthereumChain result schema.
 * Returns null on success.
 */
export const SwitchEthereumChainResult = S.Null;

/**
 * wallet_switchEthereumChain request schema.
 */
export const SwitchEthereumChainRequest = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	method: S.Literal("wallet_switchEthereumChain"),
	params: SwitchEthereumChainParams,
	id: S.optional(JsonRpcIdSchema),
});

/**
 * wallet_switchEthereumChain response schema.
 */
export const SwitchEthereumChainResponse = S.Struct({
	jsonrpc: JsonRpcVersionSchema,
	id: JsonRpcIdSchema,
	result: SwitchEthereumChainResult,
});

/** Type for SwitchEthereumChainRequest */
export type SwitchEthereumChainRequestType = S.Schema.Type<
	typeof SwitchEthereumChainRequest
>;

/** Type for SwitchEthereumChainResponse */
export type SwitchEthereumChainResponseType = S.Schema.Type<
	typeof SwitchEthereumChainResponse
>;
