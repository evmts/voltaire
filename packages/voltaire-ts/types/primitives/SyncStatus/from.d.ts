/**
 * Create SyncStatus from RPC response
 *
 * @param {boolean | { startingBlock: bigint | number | string; currentBlock: bigint | number | string; highestBlock: bigint | number | string; pulledStates?: bigint | number | string; knownStates?: bigint | number | string }} value - RPC sync status
 * @returns {import('./SyncStatusType.js').SyncStatusType} SyncStatus
 *
 * @example
 * ```typescript
 * const notSyncing = SyncStatus.from(false);
 * const syncing = SyncStatus.from({
 *   startingBlock: 0n,
 *   currentBlock: 1000n,
 *   highestBlock: 2000n,
 * });
 * ```
 */
export function from(value: boolean | {
    startingBlock: bigint | number | string;
    currentBlock: bigint | number | string;
    highestBlock: bigint | number | string;
    pulledStates?: bigint | number | string;
    knownStates?: bigint | number | string;
}): import("./SyncStatusType.js").SyncStatusType;
//# sourceMappingURL=from.d.ts.map