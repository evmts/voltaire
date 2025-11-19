import type { brand } from "../../brand.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";

/**
 * Branded EventLog type
 */
export type EventLogType<
	TAddress extends BrandedAddress = BrandedAddress,
	TTopics extends readonly HashType[] = readonly HashType[],
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
	transactionHash?: HashType;
	/** Transaction index in block */
	transactionIndex?: number;
	/** Block hash */
	blockHash?: HashType;
	/** Log index in block */
	logIndex?: number;
	/** Log removed due to chain reorganization */
	removed?: boolean;
} & { readonly [brand]: "EventLog" };

/**
 * Event log filter for querying logs
 */
export type Filter<
	TAddress extends BrandedAddress | BrandedAddress[] | undefined =
		| BrandedAddress
		| BrandedAddress[]
		| undefined,
	TTopics extends readonly (HashType | HashType[] | null)[] | undefined =
		| readonly (HashType | HashType[] | null)[]
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
	blockHash?: HashType;
};
