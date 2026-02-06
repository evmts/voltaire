/**
 * Benchmark: SyncStatus operations
 * Tests sync status parsing and progress calculation
 */

import { bench, run } from "mitata";
import * as SyncStatus from "./index.js";

// Test data
const notSyncing = false;
const syncingData = {
	startingBlock: 1000000n,
	currentBlock: 1500000n,
	highestBlock: 2000000n,
};

// Pre-created sync statuses
const statusNotSyncing = SyncStatus.from(notSyncing);
const statusSyncing = SyncStatus.from(syncingData);

// ============================================================================
// from (constructor)
// ============================================================================

bench("SyncStatus.from - not syncing - voltaire", () => {
	SyncStatus.from(false);
});

bench("SyncStatus.from - syncing - voltaire", () => {
	SyncStatus.from({
		startingBlock: 1000000n,
		currentBlock: 1500000n,
		highestBlock: 2000000n,
	});
});

await run();

// ============================================================================
// isSyncing
// ============================================================================

bench("SyncStatus.isSyncing - not syncing - voltaire", () => {
	SyncStatus.isSyncing(statusNotSyncing);
});

bench("SyncStatus.isSyncing - syncing - voltaire", () => {
	SyncStatus.isSyncing(statusSyncing);
});

await run();

// ============================================================================
// getProgress
// ============================================================================

bench("SyncStatus.getProgress - not syncing - voltaire", () => {
	SyncStatus.getProgress(statusNotSyncing);
});

bench("SyncStatus.getProgress - syncing - voltaire", () => {
	SyncStatus.getProgress(statusSyncing);
});

await run();

// ============================================================================
// Full workflow: from + isSyncing + getProgress
// ============================================================================

bench("SyncStatus workflow - from + check - voltaire", () => {
	const status = SyncStatus.from(syncingData);
	if (SyncStatus.isSyncing(status)) {
		SyncStatus.getProgress(status);
	}
});

await run();
