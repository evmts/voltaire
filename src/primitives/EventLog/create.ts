import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";
import type { BrandedEventLog } from "./BrandedEventLog.js";

/**
 * Create event log
 *
 * @param params Event log parameters
 * @returns EventLog object
 *
 * @example
 * ```typescript
 * // Static call
 * const log = EventLog.create({
 *   address: "0x..." as Address,
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([...]),
 * });
 *
 * // Factory call
 * const log2 = EventLog({
 *   address: "0x..." as Address,
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([...]),
 * });
 * ```
 */
export function create<
	TAddress extends Address = Address,
	TTopics extends readonly Hash[] = readonly Hash[],
>(params: {
	address: TAddress;
	topics: TTopics;
	data: Uint8Array;
	blockNumber?: bigint;
	transactionHash?: Hash;
	transactionIndex?: number;
	blockHash?: Hash;
	logIndex?: number;
	removed?: boolean;
}): BrandedEventLog<TAddress, TTopics> {
	const result: BrandedEventLog<TAddress, TTopics> = {
		address: params.address,
		topics: params.topics,
		data: params.data,
		removed: params.removed ?? false,
	} as BrandedEventLog<TAddress, TTopics>;
	if (params.blockNumber !== undefined) {
		result.blockNumber = params.blockNumber;
	}
	if (params.transactionHash !== undefined) {
		result.transactionHash = params.transactionHash;
	}
	if (params.transactionIndex !== undefined) {
		result.transactionIndex = params.transactionIndex;
	}
	if (params.blockHash !== undefined) {
		result.blockHash = params.blockHash;
	}
	if (params.logIndex !== undefined) {
		result.logIndex = params.logIndex;
	}
	return result;
}
