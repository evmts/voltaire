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

/** Alias for EventLogType - for backwards compatibility */
export type BrandedEventLog = EventLogType;

/**
 * Input type for creating EventLogs (accepts strings for addresses/hashes)
 */
export type EventLogLike = {
	address: BrandedAddress | string;
	topics: readonly (HashType | string)[];
	data: Uint8Array | string;
	blockNumber?: bigint | number;
	transactionHash?: HashType | string;
	transactionIndex?: number;
	blockHash?: HashType | string;
	logIndex?: number;
	removed?: boolean;
};

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

/**
 * JSON-RPC Ethereum log format (Execution API specification)
 */
export type RpcLog = {
	/** Contract address that emitted the log */
	address: string;
	/** Hash of block containing this log or null if pending */
	blockHash?: string | null | undefined;
	/** Hex-encoded block number or null if pending */
	blockNumber: string | null;
	/** Optional hex-encoded block timestamp or null if pending */
	blockTimestamp?: string | null | undefined;
	/** Hex-encoded event data */
	data: string;
	/** Hex-encoded log index in block or null if pending */
	logIndex: string | null;
	/** Array of hex-encoded event topics */
	topics: string[];
	/** Hash of transaction that generated the log or null if pending */
	transactionHash?: string | null | undefined;
	/** Hex-encoded transaction index in block or null if pending */
	transactionIndex: string | null;
	/** True if log was removed due to chain reorganization */
	removed: boolean;
};
