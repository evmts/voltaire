import type { brand } from "../../brand.js";

/**
 * Filter identifier returned by eth_newFilter, eth_newBlockFilter, eth_newPendingTransactionFilter
 *
 * Opaque identifier used to track active filters on a node. Typically a hex string like "0x1".
 */
export type FilterIdType = string & {
	readonly [brand]: "FilterId";
};
