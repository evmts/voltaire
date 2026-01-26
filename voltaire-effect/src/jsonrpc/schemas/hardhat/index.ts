/**
 * @fileoverview Effect Schemas for hardhat_* JSON-RPC methods.
 * @module jsonrpc/schemas/hardhat
 * @since 0.1.0
 */

import * as S from "effect/Schema";

// =============================================================================
// Re-export individual method schemas
// =============================================================================

export * from "./dropTransaction.js";
export * from "./impersonateAccount.js";
export * from "./mine.js";
export * from "./reset.js";
export * from "./setBalance.js";
export * from "./setCode.js";
export * from "./setNonce.js";
export * from "./setStorageAt.js";
export * from "./stopImpersonatingAccount.js";

// =============================================================================
// Import for union building
// =============================================================================

import { DropTransactionRequest } from "./dropTransaction.js";
import { ImpersonateAccountRequest } from "./impersonateAccount.js";
import { MineRequest } from "./mine.js";
import { ResetRequest } from "./reset.js";
import { SetBalanceRequest } from "./setBalance.js";
import { SetCodeRequest } from "./setCode.js";
import { SetNonceRequest } from "./setNonce.js";
import { SetStorageAtRequest } from "./setStorageAt.js";
import { StopImpersonatingAccountRequest } from "./stopImpersonatingAccount.js";

// =============================================================================
// Union Schema for all hardhat_* requests
// =============================================================================

/**
 * Union schema for all hardhat_* JSON-RPC request types.
 * Discriminates on the `method` field.
 */
export const HardhatMethodRequest = S.Union(
	ImpersonateAccountRequest,
	StopImpersonatingAccountRequest,
	MineRequest,
	SetBalanceRequest,
	SetCodeRequest,
	SetNonceRequest,
	SetStorageAtRequest,
	ResetRequest,
	DropTransactionRequest,
);

/** Type for HardhatMethodRequest union */
export type HardhatMethodRequestType = S.Schema.Type<
	typeof HardhatMethodRequest
>;
