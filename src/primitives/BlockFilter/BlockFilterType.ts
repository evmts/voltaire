import type { brand } from "../../brand.js";
import type { FilterIdType } from "../FilterId/FilterIdType.js";

/**
 * Block filter created by eth_newBlockFilter
 *
 * Notifies of new blocks when polled with eth_getFilterChanges.
 * Returns array of block hashes.
 */
export type BlockFilterType = {
	/** Filter identifier */
	readonly filterId: FilterIdType;
	/** Filter type discriminator */
	readonly type: "block";
} & {
	readonly [brand]: "BlockFilter";
};
