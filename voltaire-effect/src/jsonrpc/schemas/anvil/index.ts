/**
 * @fileoverview Effect Schemas for anvil_* JSON-RPC methods.
 * @module jsonrpc/schemas/anvil
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
export * from "./revert.js";
export * from "./setAutomine.js";
export * from "./setBalance.js";
export * from "./setBlockTimestampInterval.js";
export * from "./setCode.js";
export * from "./setNextBlockTimestamp.js";
export * from "./setNonce.js";
export * from "./setStorageAt.js";
export * from "./snapshot.js";
export * from "./stopImpersonatingAccount.js";

// =============================================================================
// Import for union building
// =============================================================================

import { DropTransactionRequest } from "./dropTransaction.js";
import { ImpersonateAccountRequest } from "./impersonateAccount.js";
import { MineRequest } from "./mine.js";
import { ResetRequest } from "./reset.js";
import { RevertRequest } from "./revert.js";
import { SetAutomineRequest } from "./setAutomine.js";
import { SetBalanceRequest } from "./setBalance.js";
import { SetBlockTimestampIntervalRequest } from "./setBlockTimestampInterval.js";
import { SetCodeRequest } from "./setCode.js";
import { SetNextBlockTimestampRequest } from "./setNextBlockTimestamp.js";
import { SetNonceRequest } from "./setNonce.js";
import { SetStorageAtRequest } from "./setStorageAt.js";
import { SnapshotRequest } from "./snapshot.js";
import { StopImpersonatingAccountRequest } from "./stopImpersonatingAccount.js";

// =============================================================================
// Union Schema for all anvil_* requests
// =============================================================================

/**
 * Union schema for all anvil_* JSON-RPC request types.
 * Discriminates on the `method` field.
 */
export const AnvilMethodRequest = S.Union(
	ImpersonateAccountRequest,
	StopImpersonatingAccountRequest,
	MineRequest,
	SetBalanceRequest,
	SetCodeRequest,
	SetNonceRequest,
	SetStorageAtRequest,
	SnapshotRequest,
	RevertRequest,
	SetBlockTimestampIntervalRequest,
	SetNextBlockTimestampRequest,
	SetAutomineRequest,
	DropTransactionRequest,
	ResetRequest,
);

/** Type for AnvilMethodRequest union */
export type AnvilMethodRequestType = S.Schema.Type<typeof AnvilMethodRequest>;
