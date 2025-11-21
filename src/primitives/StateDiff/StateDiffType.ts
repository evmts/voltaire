import type { AddressType } from "../Address/AddressType.js";
import type { WeiType } from "../Denomination/WeiType.js";
import type { NonceType } from "../Nonce/NonceType.js";
import type { StorageKeyType } from "../State/StorageKeyType.js";
import type { StorageValueType } from "../StorageValue/StorageValueType.js";

/**
 * Balance change (before/after)
 */
export type BalanceChange = {
	readonly from: WeiType | null;
	readonly to: WeiType | null;
};

/**
 * Nonce change (before/after)
 */
export type NonceChange = {
	readonly from: NonceType | null;
	readonly to: NonceType | null;
};

/**
 * Code change (before/after)
 */
export type CodeChange = {
	readonly from: Uint8Array | null;
	readonly to: Uint8Array | null;
};

/**
 * Account state changes during transaction execution
 *
 * Captures all state modifications for a single account.
 * Used extensively by debug_traceTransaction with prestateTracer.
 */
export type AccountDiff = {
	readonly balance?: BalanceChange;
	readonly nonce?: NonceChange;
	readonly code?: CodeChange;
	readonly storage?: ReadonlyMap<
		StorageKeyType,
		{
			readonly from: StorageValueType | null;
			readonly to: StorageValueType | null;
		}
	>;
};

/**
 * Complete state changes across all accounts
 *
 * Represents full state diff from debug_traceTransaction prestateTracer.
 * Maps addresses to their account-level changes.
 *
 * @example
 * ```typescript
 * const stateDiff: StateDiffType = {
 *   accounts: new Map([
 *     [address1, {
 *       balance: { from: oldBalance, to: newBalance },
 *       nonce: { from: 0n, to: 1n },
 *       storage: new Map([
 *         [key, { from: null, to: value }]
 *       ])
 *     }]
 *   ])
 * };
 * ```
 */
export type StateDiffType = {
	/**
	 * Map of account addresses to their state changes
	 */
	readonly accounts: ReadonlyMap<AddressType, AccountDiff>;
};
