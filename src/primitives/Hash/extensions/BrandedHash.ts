import type { brand } from "../../../brand.js";

export type BrandedHash = Uint8Array & {
	readonly [brand]: "Hash";
};

export const SIZE = 32;
