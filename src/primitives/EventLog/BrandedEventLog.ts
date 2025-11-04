import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";

/**
 * Branded EventLog type
 */
export type BrandedEventLog<
	TAddress extends Address = Address,
	TTopics extends readonly Hash[] = readonly Hash[],
> = {
	/** Contract address that emitted the log */
	address: TAddress;
	/** Event topics (topic0 = event signature, topic1-3 = indexed parameters) */
	topics: TTopics;
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
} & { readonly __tag: "EventLog" };

/**
 * Event log filter for querying logs
 */
export type Filter<
	TAddress extends Address | Address[] | undefined =
		| Address
		| Address[]
		| undefined,
	TTopics extends readonly (Hash | Hash[] | null)[] | undefined =
		| readonly (Hash | Hash[] | null)[]
		| undefined,
> = {
	/** Contract address(es) to filter by */
	address?: TAddress;
	/** Topic filters (null entries match any topic, arrays match any of the hashes) */
	topics?: TTopics;
	/** Starting block number */
	fromBlock?: bigint;
	/** Ending block number */
	toBlock?: bigint;
	/** Block hash to filter by (alternative to fromBlock/toBlock) */
	blockHash?: Hash;
};
