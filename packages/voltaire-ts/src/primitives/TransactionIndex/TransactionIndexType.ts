import type { brand } from "../../brand.js";

/**
 * Transaction index in block (0-based)
 */
export type TransactionIndexType = number & {
	readonly [brand]: "TransactionIndex";
};
