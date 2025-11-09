import * as BrandedBloomFilter from "../../../src/primitives/BloomFilter/BrandedBloomFilter/index.js";
// Demonstrate bloom filter serialization and restoration
import {
	BITS,
	BloomFilter,
	DEFAULT_HASH_COUNT,
} from "../../../src/primitives/BloomFilter/index.js";

// Create and populate a filter
const original = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
const encoder = new TextEncoder();

const items = ["Transfer", "Approval", "Swap", "Mint", "Burn"];

for (const item of items) {
	original.add(encoder.encode(item));
}

// Serialize to hex
const hexString = original.toHex();
const restored = BrandedBloomFilter.fromHex(
	hexString,
	BITS,
	DEFAULT_HASH_COUNT,
);
for (const item of items) {
	const contains = BrandedBloomFilter.contains(restored, encoder.encode(item));
}
const storageFormat = {
	hex: hexString,
	m: original.m,
	k: original.k,
	timestamp: new Date().toISOString(),
	itemCount: items.length,
};
const originalHex = original.toHex();
const restoredHex = BrandedBloomFilter.toHex(restored);
const identical = originalHex === restoredHex;

// Demonstrate byte-level comparison
let matchingBytes = 0;
for (let i = 0; i < original.length; i++) {
	if (original[i] === restored[i]) matchingBytes++;
}

interface BlockFilter {
	blockNumber: number;
	hex: string;
	m: number;
	k: number;
}

const blockFilters: BlockFilter[] = [];

for (let blockNum = 1000; blockNum < 1003; blockNum++) {
	const blockFilter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

	// Simulate adding block-specific data
	blockFilter.add(encoder.encode(`block-${blockNum}`));
	blockFilter.add(encoder.encode(`data-${blockNum}`));

	blockFilters.push({
		blockNumber: blockNum,
		hex: blockFilter.toHex(),
		m: blockFilter.m,
		k: blockFilter.k,
	});
}
const block1001Data = blockFilters.find((b) => b.blockNumber === 1001)!;
const block1001Filter = BrandedBloomFilter.fromHex(
	block1001Data.hex,
	block1001Data.m,
	block1001Data.k,
);

const queryItem = encoder.encode("block-1001");
const withPrefix = original.toHex(); // Returns with 0x
const withoutPrefix = withPrefix.slice(2);

// Both formats work for fromHex
const fromWith = BrandedBloomFilter.fromHex(
	withPrefix,
	BITS,
	DEFAULT_HASH_COUNT,
);
const fromWithout = BrandedBloomFilter.fromHex(
	withoutPrefix,
	BITS,
	DEFAULT_HASH_COUNT,
);
