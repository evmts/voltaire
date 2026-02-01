import type { brand } from "../../brand.js";

/**
 * Transaction hash (32-byte identifier)
 */
export type TransactionHashType = Uint8Array & {
	readonly [brand]: "TransactionHash";
	readonly length: 32;
};

export const SIZE = 32;
