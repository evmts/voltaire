export type BrandedBloomFilter = Uint8Array & {
	readonly __tag: "BloomFilter";
	readonly k: number;
	readonly m: number;
	toHex(this: BrandedBloomFilter): string;
};
