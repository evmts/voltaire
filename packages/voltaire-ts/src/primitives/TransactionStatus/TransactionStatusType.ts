import type { Uint256Type } from "../Uint/Uint256Type.js";

/**
 * Transaction status in receipt
 */
export type TransactionStatusType =
	| { readonly type: "pending" }
	| { readonly type: "success"; readonly gasUsed: Uint256Type }
	| { readonly type: "failed"; readonly revertReason?: string };
