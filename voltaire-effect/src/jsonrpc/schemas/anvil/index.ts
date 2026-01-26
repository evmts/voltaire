/**
 * @fileoverview Effect Schemas for anvil_* JSON-RPC methods.
 * @module jsonrpc/schemas/anvil
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
export * from "./snapshot.js";
export * from "./revert.js";
export * from "./setBlockTimestampInterval.js";
export * from "./setNextBlockTimestamp.js";
export * from "./setAutomine.js";
export * from "./dropTransaction.js";
export * from "./reset.js";

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
import { SnapshotRequest } from "./snapshot.js";
import { RevertRequest } from "./revert.js";
import { SetBlockTimestampIntervalRequest } from "./setBlockTimestampInterval.js";
import { SetNextBlockTimestampRequest } from "./setNextBlockTimestamp.js";
import { SetAutomineRequest } from "./setAutomine.js";
import { DropTransactionRequest } from "./dropTransaction.js";
import { ResetRequest } from "./reset.js";

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
