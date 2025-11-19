export type {
	SyncStatusType,
	SyncProgress,
} from "./SyncStatusType.js";

import { from as _from } from "./from.js";
import { isSyncing as _isSyncing } from "./isSyncing.js";
import { getProgress as _getProgress } from "./getProgress.js";

// Export constructors
export { from } from "./from.js";

// Export public wrapper functions
export function isSyncing(
	status:
		| import("./SyncStatusType.js").SyncStatusType
		| boolean
		| { startingBlock: bigint; currentBlock: bigint; highestBlock: bigint },
): boolean {
	const s =
		typeof status === "boolean" || "startingBlock" in status
			? _from(status)
			: status;
	return _isSyncing(s);
}

export function getProgress(
	status:
		| import("./SyncStatusType.js").SyncStatusType
		| boolean
		| { startingBlock: bigint; currentBlock: bigint; highestBlock: bigint },
): number {
	const s =
		typeof status === "boolean" || "startingBlock" in status
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
