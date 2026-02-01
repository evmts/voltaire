export type { SyncProgress, SyncStatusType, } from "./SyncStatusType.js";
import { from as _from } from "./from.js";
import { getProgress as _getProgress } from "./getProgress.js";
import { isSyncing as _isSyncing } from "./isSyncing.js";
export { from } from "./from.js";
export declare function isSyncing(status: import("./SyncStatusType.js").SyncStatusType | boolean | {
    startingBlock: bigint;
    currentBlock: bigint;
    highestBlock: bigint;
}): boolean;
export declare function getProgress(status: import("./SyncStatusType.js").SyncStatusType | boolean | {
    startingBlock: bigint;
    currentBlock: bigint;
    highestBlock: bigint;
}): number;
export { _isSyncing, _getProgress };
export declare const SyncStatus: {
    from: typeof _from;
    isSyncing: typeof isSyncing;
    getProgress: typeof getProgress;
};
//# sourceMappingURL=index.d.ts.map