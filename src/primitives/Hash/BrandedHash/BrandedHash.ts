import type { brand } from "../../../brand.js";

export type BrandedHash = Uint8Array & {
	readonly [brand]: "Hash";
};

/**
 * Inputs that can be converted to Hash
 */
export type HashLike = BrandedHash | bigint | string | Uint8Array;

export const SIZE = 32;
