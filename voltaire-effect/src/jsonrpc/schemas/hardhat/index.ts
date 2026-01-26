/**
 * @fileoverview Effect Schemas for hardhat_* JSON-RPC methods.
 * @module jsonrpc/schemas/hardhat
 * @since 0.1.0
 */

import * as S from "effect/Schema";

// =============================================================================
// Re-export individual method schemas
// =============================================================================

export * from "./impersonateAccount.js";
export * from "./stopImpersonatingAccount.js";
export * from "./mine.js";
export * from "./setBalance.js";
export * from "./setCode.js";
export * from "./setNonce.js";
export * from "./setStorageAt.js";
export * from "./reset.js";
export * from "./dropTransaction.js";

// =============================================================================
// Import for union building
// =============================================================================

import { ImpersonateAccountRequest } from "./impersonateAccount.js";
import { StopImpersonatingAccountRequest } from "./stopImpersonatingAccount.js";
import { MineRequest } from "./mine.js";
import { SetBalanceRequest } from "./setBalance.js";
import { SetCodeRequest } from "./setCode.js";
import { SetNonceRequest } from "./setNonce.js";
import { SetStorageAtRequest } from "./setStorageAt.js";
import { ResetRequest } from "./reset.js";
import { DropTransactionRequest } from "./dropTransaction.js";

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
