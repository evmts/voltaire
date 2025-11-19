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
export function from(value) {
	if (value === false) {
		return false;
	}

	if (typeof value === "object" && value !== null) {
		return {
			startingBlock: BigInt(value.startingBlock),
			currentBlock: BigInt(value.currentBlock),
			highestBlock: BigInt(value.highestBlock),
			pulledStates:
				value.pulledStates !== undefined
					? BigInt(value.pulledStates)
					: undefined,
			knownStates:
				value.knownStates !== undefined ? BigInt(value.knownStates) : undefined,
		};
	}

	throw new Error("Invalid SyncStatus input");
}
