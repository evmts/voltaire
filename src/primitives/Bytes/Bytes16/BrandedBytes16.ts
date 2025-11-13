import type { brand } from "../../../brand.js";

export type BrandedBytes16 = Uint8Array & {
	readonly [brand]: "Bytes16";
	readonly size: 16;
};

/**
 * Inputs that can be converted to Bytes16
 */
export type Bytes16Like = BrandedBytes16 | string | Uint8Array;

export const SIZE = 16;
