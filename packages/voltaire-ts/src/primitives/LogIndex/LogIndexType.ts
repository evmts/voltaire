import type { brand } from "../../brand.js";

/**
 * Log index in receipt (0-based)
 */
export type LogIndexType = number & {
	readonly [brand]: "LogIndex";
};
