// Basic BloomFilter usage: create, add items, check membership
import {
	BloomFilter,
	BITS,
	DEFAULT_HASH_COUNT,
} from "../../../src/primitives/BloomFilter/index.js";
import * as BrandedBloomFilter from "../../../src/primitives/BloomFilter/BrandedBloomFilter/index.js";

// Create a standard Ethereum bloom filter (2048 bits, 3 hash functions)
const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

console.log("Created bloom filter:");
console.log(`  Bits: ${filter.m}`);
console.log(`  Hash functions: ${filter.k}`);
console.log(`  Size: ${filter.length} bytes`);
console.log(`  Initially empty: ${filter.isEmpty()}`);

// Add some items
const encoder = new TextEncoder();
const item1 = encoder.encode("Transfer");
const item2 = encoder.encode("Approval");
const item3 = encoder.encode("Swap");

console.log("\nAdding items to filter...");
filter.add(item1);
filter.add(item2);
filter.add(item3);

console.log(`  Is empty after adding: ${filter.isEmpty()}`);

// Check membership
console.log("\nChecking membership:");
console.log(`  Contains "Transfer": ${filter.contains(item1)}`); // true
console.log(`  Contains "Approval": ${filter.contains(item2)}`); // true
console.log(`  Contains "Swap": ${filter.contains(item3)}`); // true

// Check non-member
const nonMember = encoder.encode("Burn");
console.log(`  Contains "Burn": ${filter.contains(nonMember)}`); // false (or true if false positive)

// Demonstrate idempotent add
console.log('\nAdding "Transfer" again...');
filter.add(item1);
console.log(`  Still contains "Transfer": ${filter.contains(item1)}`); // true

// Serialize to hex
const hex = filter.toHex();
console.log(`\nSerialized to hex: ${hex.slice(0, 20)}...`);

// Restore from hex
const restored = BrandedBloomFilter.fromHex(hex, BITS, DEFAULT_HASH_COUNT);
console.log(
	`\nRestored filter contains "Transfer": ${BrandedBloomFilter.contains(restored, item1)}`,
); // true
