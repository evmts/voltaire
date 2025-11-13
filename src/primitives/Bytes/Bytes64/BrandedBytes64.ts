import type { brand } from "../../../brand.js";

export type BrandedBytes64 = Uint8Array & {
	readonly [brand]: "Bytes64";
	readonly size: 64;
};

/**
 * Inputs that can be converted to Bytes64
 */
export type Bytes64Like = BrandedBytes64 | string | Uint8Array;

export const SIZE = 64;
