import type { brand } from "../../brand.js";

/**
 * Block number
 */
export type BlockNumberType = bigint & {
	readonly [brand]: "BlockNumber";
};
