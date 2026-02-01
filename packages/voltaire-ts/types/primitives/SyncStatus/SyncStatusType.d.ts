import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * Active sync progress information
 */
export type SyncProgress = {
    readonly startingBlock: BlockNumberType;
    readonly currentBlock: BlockNumberType;
    readonly highestBlock: BlockNumberType;
    readonly pulledStates?: Uint256Type;
    readonly knownStates?: Uint256Type;
};
/**
 * Sync status from eth_syncing
 *
 * false = not syncing (node is fully synced)
 * object = actively syncing with progress information
 *
 * @example
 * ```typescript
 * // Not syncing
 * const notSyncing: SyncStatusType = false;
 *
 * // Actively syncing
 * const syncing: SyncStatusType = {
 *   startingBlock: 0n,
 *   currentBlock: 1000n,
 *   highestBlock: 2000n,
 * };
 * ```
 */
export type SyncStatusType = false | SyncProgress;
//# sourceMappingURL=SyncStatusType.d.ts.map