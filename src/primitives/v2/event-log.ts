import type { Address } from "./address.ts";
import type { Hash } from "./hash.ts";

/**
 * Ethereum event log structure
 */
export interface EventLog {
	/** Contract address that emitted the log */
	address: Address;
	/** Event topics (topic0 = event signature, topic1-3 = indexed parameters) */
	topics: Hash[];
	/** Event data (non-indexed parameters) */
	data: Uint8Array;
	/** Block number where log was emitted */
	blockNumber?: bigint;
	/** Transaction hash that generated the log */
	transactionHash?: Hash;
	/** Transaction index in block */
	transactionIndex?: number;
	/** Block hash */
	blockHash?: Hash;
	/** Log index in block */
	logIndex?: number;
	/** Log removed due to chain reorganization */
	removed?: boolean;
}

/**
 * Create event log
 *
 * @param params Event log parameters
 * @returns EventLog object
 */
export function create(params: {
	address: Address;
	topics: Hash[];
	data: Uint8Array;
	blockNumber?: bigint;
	transactionHash?: Hash;
	transactionIndex?: number;
	blockHash?: Hash;
	logIndex?: number;
	removed?: boolean;
}): EventLog {
	return {
		address: params.address,
		topics: params.topics,
		data: params.data,
		blockNumber: params.blockNumber,
		transactionHash: params.transactionHash,
		transactionIndex: params.transactionIndex,
		blockHash: params.blockHash,
		logIndex: params.logIndex,
		removed: params.removed ?? false,
	};
}

/**
 * Check if log matches topic filter
 *
 * @param log Event log to check
 * @param filterTopics Topic filter (null entries match any topic)
 * @returns true if log matches filter
 */
export function matches(
	log: EventLog,
	filterTopics: (Hash | null)[],
): boolean {
	for (let i = 0; i < filterTopics.length; i++) {
		const filterTopic = filterTopics[i];
		if (filterTopic === null) {
			continue;
		}
		if (i >= log.topics.length) {
			return false;
		}
		// Compare topics byte by byte
		const logTopic = log.topics[i];
		if (logTopic.length !== filterTopic.length) {
			return false;
		}
		let match = true;
		for (let j = 0; j < logTopic.length; j++) {
			if (logTopic[j] !== filterTopic[j]) {
				match = false;
				break;
			}
		}
		if (!match) {
			return false;
		}
	}
	return true;
}
