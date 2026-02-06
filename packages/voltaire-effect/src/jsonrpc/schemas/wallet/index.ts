/**
 * @fileoverview Effect Schemas for wallet_* JSON-RPC methods.
 * @module jsonrpc/schemas/wallet
 * @since 0.1.0
 */

import * as S from "effect/Schema";

// =============================================================================
// Re-export individual method schemas
// =============================================================================

export * from "./addEthereumChain.js";
export * from "./getCallsStatus.js";
export * from "./getCapabilities.js";
export * from "./getPermissions.js";
export * from "./registerOnboarding.js";
export * from "./requestPermissions.js";
export * from "./revokePermissions.js";
export * from "./sendCalls.js";
export * from "./showCallsStatus.js";
export * from "./switchEthereumChain.js";
export * from "./watchAsset.js";

// =============================================================================
// Import for union building
// =============================================================================

import { AddEthereumChainRequest } from "./addEthereumChain.js";
import { GetCallsStatusRequest } from "./getCallsStatus.js";
import { GetCapabilitiesRequest } from "./getCapabilities.js";
import { GetPermissionsRequest } from "./getPermissions.js";
import { RegisterOnboardingRequest } from "./registerOnboarding.js";
import { RequestPermissionsRequest } from "./requestPermissions.js";
import { RevokePermissionsRequest } from "./revokePermissions.js";
import { SendCallsRequest } from "./sendCalls.js";
import { ShowCallsStatusRequest } from "./showCallsStatus.js";
import { SwitchEthereumChainRequest } from "./switchEthereumChain.js";
import { WatchAssetRequest } from "./watchAsset.js";

// =============================================================================
// Union Schema for all wallet_* requests
// =============================================================================

/**
 * Union schema for all wallet_* JSON-RPC request types.
 * Discriminates on the `method` field.
 */
export const WalletMethodRequest = S.Union(
	AddEthereumChainRequest,
	GetCallsStatusRequest,
	GetCapabilitiesRequest,
	GetPermissionsRequest,
	RegisterOnboardingRequest,
	RequestPermissionsRequest,
	RevokePermissionsRequest,
	SendCallsRequest,
	ShowCallsStatusRequest,
	SwitchEthereumChainRequest,
	WatchAssetRequest,
);

/** Type for WalletMethodRequest union */
export type WalletMethodRequestType = S.Schema.Type<typeof WalletMethodRequest>;
