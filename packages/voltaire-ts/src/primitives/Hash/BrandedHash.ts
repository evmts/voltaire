import type { brand } from "../../brand.js";

export type HashType = Uint8Array & {
	readonly [brand]: "Hash";
};

/** Alias for HashType - for backwards compatibility */
export type BrandedHash = HashType;

/**
 * Inputs that can be converted to Hash
 */
export type HashLike = HashType | bigint | string | Uint8Array;

export const SIZE = 32;
