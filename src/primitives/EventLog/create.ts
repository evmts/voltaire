import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";
import type { Data } from "./EventLog.js";

/**
 * Create event log (standard form)
 *
 * @param params Event log parameters
 * @returns EventLog object
 *
 * @example
 * ```typescript
 * const log = EventLog.create({
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
}): Data<TAddress, TTopics> {
	const result: Data<TAddress, TTopics> = {
		address: params.address,
		topics: params.topics,
		data: params.data,
		removed: params.removed ?? false,
	};
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
