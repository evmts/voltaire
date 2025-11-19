import type { brand } from "../../brand.js";
import type { AddressType } from "../Address/AddressType.js";
import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
import type { HashType } from "../Hash/HashType/HashType.js";
import type { TopicFilterType } from "../TopicFilter/TopicFilterType.js";

/**
 * Block identifier for log filter queries
 */
export type BlockTag = "earliest" | "latest" | "pending";

/**
 * Log filter parameters for eth_getLogs and eth_newFilter
 *
 * Filters can specify:
 * - Block range (fromBlock/toBlock) OR specific block (blockhash)
 * - Contract address(es) to filter by
 * - Topic filters for indexed event parameters
 *
 * @example
 * ```typescript
 * // Filter Transfer events to specific address
 * const filter: LogFilter = {
 *   fromBlock: "latest",
 *   address: contractAddr,
 *   topics: [transferEventSig, null, recipientHash]
 * };
 *
 * // Filter by specific block hash
 * const filter2: LogFilter = {
 *   blockhash: blockHash,
 *   address: contractAddr
 * };
 * ```
 */
export type LogFilterType = {
	/** Starting block number or tag */
	readonly fromBlock?: BlockNumberType | BlockTag;
	/** Ending block number or tag */
	readonly toBlock?: BlockNumberType | BlockTag;
	/** Single address or array of addresses to filter by */
	readonly address?: AddressType | readonly AddressType[];
	/** Topic filters (up to 4 indexed parameters) */
	readonly topics?: TopicFilterType;
	/** Specific block hash (mutually exclusive with fromBlock/toBlock) */
	readonly blockhash?: HashType;
} & {
	readonly [brand]: "LogFilter";
};
