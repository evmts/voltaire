import * as BrandedBloomFilter from "../../../src/primitives/BloomFilter/BrandedBloomFilter/index.js";
// Basic BloomFilter usage: create, add items, check membership
import {
	BITS,
	BloomFilter,
	DEFAULT_HASH_COUNT,
} from "../../../src/primitives/BloomFilter/index.js";

// Create a standard Ethereum bloom filter (2048 bits, 3 hash functions)
const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

// Add some items
const encoder = new TextEncoder();
const item1 = encoder.encode("Transfer");
const item2 = encoder.encode("Approval");
const item3 = encoder.encode("Swap");
filter.add(item1);
filter.add(item2);
filter.add(item3);

// Check non-member
const nonMember = encoder.encode("Burn");
filter.add(item1);

// Serialize to hex
const hex = filter.toHex();

// Restore from hex
const restored = BrandedBloomFilter.fromHex(hex, BITS, DEFAULT_HASH_COUNT);
