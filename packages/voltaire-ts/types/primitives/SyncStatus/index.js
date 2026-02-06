import { from as _from } from "./from.js";
import { getProgress as _getProgress } from "./getProgress.js";
import { isSyncing as _isSyncing } from "./isSyncing.js";
// Export constructors
export { from } from "./from.js";
// Export public wrapper functions
export function isSyncing(status) {
    const s = typeof status === "boolean" || "startingBlock" in status
        ? _from(status)
        : status;
    return _isSyncing(s);
}
export function getProgress(status) {
    const s = typeof status === "boolean" || "startingBlock" in status
        ? _from(status)
        : status;
    return _getProgress(s);
}
// Export internal functions (tree-shakeable)
export { _isSyncing, _getProgress };
// Namespace export
export const SyncStatus = {
    from: _from,
    isSyncing,
    getProgress,
};
