import type { brand } from "../../../brand.js";

export type BrandedBloomFilter = Uint8Array & {
	readonly [brand]: "BloomFilter";
	readonly k: number;
	readonly m: number;
	toHex(this: BrandedBloomFilter): string;
};
