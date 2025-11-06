import { bench, run } from "mitata";
import * as BloomFilter from "./BrandedBloomFilter/index.js";
import { BITS, DEFAULT_HASH_COUNT } from "./BrandedBloomFilter/constants.js";

const encoder = new TextEncoder();

console.log("=".repeat(80));
console.log("BloomFilter Benchmark");
console.log("=".repeat(80));
console.log("");

// =============================================================================
// 1. BloomFilter.create - Create filters of various sizes
// =============================================================================

console.log("1. BloomFilter.create - Create filters of various sizes");
console.log("-".repeat(80));

bench("BloomFilter.create - 256 bits (32B)", () => {
	BloomFilter.create(256, 3);
});

bench("BloomFilter.create - 2048 bits (256B)", () => {
	BloomFilter.create(2048, 3);
});

bench("BloomFilter.create - 16384 bits (2KB)", () => {
	BloomFilter.create(16384, 3);
});

await run();
console.log("");

// =============================================================================
// 2. BloomFilter.add - Add items to filter
// =============================================================================

console.log("2. BloomFilter.add - Add items to filter");
console.log("-".repeat(80));

const filter256 = BloomFilter.create(256, 3);
const filter2048 = BloomFilter.create(2048, 3);
const filter16384 = BloomFilter.create(16384, 3);

const testItem = encoder.encode("test");
const testAddress = new Uint8Array(20).fill(0x42);
const testTopic = new Uint8Array(32).fill(0x42);

bench("BloomFilter.add - 256 bits (string)", () => {
	BloomFilter.add(filter256, testItem);
});

bench("BloomFilter.add - 2048 bits (string)", () => {
	BloomFilter.add(filter2048, testItem);
});

bench("BloomFilter.add - 16384 bits (string)", () => {
	BloomFilter.add(filter16384, testItem);
});

bench("BloomFilter.add - address (20B)", () => {
	BloomFilter.add(filter2048, testAddress);
});

bench("BloomFilter.add - topic (32B)", () => {
	BloomFilter.add(filter2048, testTopic);
});

await run();
console.log("");

// =============================================================================
// 3. BloomFilter.contains - Check if item exists
// =============================================================================

console.log("3. BloomFilter.contains - Check if item exists");
console.log("-".repeat(80));

const filterWithItems = BloomFilter.create(2048, 3);
BloomFilter.add(filterWithItems, testItem);
BloomFilter.add(filterWithItems, testAddress);
BloomFilter.add(filterWithItems, testTopic);

const notInFilter = encoder.encode("not-in-filter");

bench("BloomFilter.contains - item exists", () => {
	BloomFilter.contains(filterWithItems, testItem);
});

bench("BloomFilter.contains - item not exists", () => {
	BloomFilter.contains(filterWithItems, notInFilter);
});

bench("BloomFilter.contains - address exists", () => {
	BloomFilter.contains(filterWithItems, testAddress);
});

bench("BloomFilter.contains - topic exists", () => {
	BloomFilter.contains(filterWithItems, testTopic);
});

await run();
console.log("");

// =============================================================================
// 4. BloomFilter.merge - Merge two filters
// =============================================================================

console.log("4. BloomFilter.merge - Merge two filters");
console.log("-".repeat(80));

const filter1 = BloomFilter.create(2048, 3);
const filter2 = BloomFilter.create(2048, 3);
BloomFilter.add(filter1, encoder.encode("item1"));
BloomFilter.add(filter2, encoder.encode("item2"));

bench("BloomFilter.merge - 2048 bits", () => {
	BloomFilter.merge(filter1, filter2);
});

const filter1Large = BloomFilter.create(16384, 3);
const filter2Large = BloomFilter.create(16384, 3);
BloomFilter.add(filter1Large, encoder.encode("item1"));
BloomFilter.add(filter2Large, encoder.encode("item2"));

bench("BloomFilter.merge - 16384 bits", () => {
	BloomFilter.merge(filter1Large, filter2Large);
});

await run();
console.log("");

// =============================================================================
// 5. BloomFilter.isEmpty - Check if filter is empty
// =============================================================================

console.log("5. BloomFilter.isEmpty - Check if filter is empty");
console.log("-".repeat(80));

const emptyFilter = BloomFilter.create(2048, 3);
const fullFilter = BloomFilter.create(2048, 3);
for (let i = 0; i < fullFilter.length; i++) {
	fullFilter[i] = 0xff;
}

bench("BloomFilter.isEmpty - empty filter", () => {
	BloomFilter.isEmpty(emptyFilter);
});

bench("BloomFilter.isEmpty - full filter", () => {
	BloomFilter.isEmpty(fullFilter);
});

bench("BloomFilter.isEmpty - filter with items", () => {
	BloomFilter.isEmpty(filterWithItems);
});

await run();
console.log("");

// =============================================================================
// 6. BloomFilter.toHex / fromHex - Serialization
// =============================================================================

console.log("6. BloomFilter.toHex / fromHex - Serialization");
console.log("-".repeat(80));

const filterToSerialize = BloomFilter.create(2048, 3);
BloomFilter.add(filterToSerialize, testItem);
const hexString = BloomFilter.toHex(filterToSerialize);

bench("BloomFilter.toHex - 2048 bits", () => {
	BloomFilter.toHex(filterToSerialize);
});

bench("BloomFilter.fromHex - 2048 bits", () => {
	BloomFilter.fromHex(hexString, BITS, DEFAULT_HASH_COUNT);
});

await run();
console.log("");

// =============================================================================
// 7. BloomFilter.density - Calculate density
// =============================================================================

console.log("7. BloomFilter.density - Calculate density");
console.log("-".repeat(80));

bench("BloomFilter.density - empty filter", () => {
	BloomFilter.density(emptyFilter);
});

bench("BloomFilter.density - filter with items", () => {
	BloomFilter.density(filterWithItems);
});

bench("BloomFilter.density - full filter", () => {
	BloomFilter.density(fullFilter);
});

await run();
console.log("");

// =============================================================================
// 8. BloomFilter.expectedFalsePositiveRate - Calculate FPR
// =============================================================================

console.log("8. BloomFilter.expectedFalsePositiveRate - Calculate FPR");
console.log("-".repeat(80));

bench("BloomFilter.expectedFalsePositiveRate - 50 items", () => {
	BloomFilter.expectedFalsePositiveRate(filterWithItems, 50);
});

bench("BloomFilter.expectedFalsePositiveRate - 200 items", () => {
	BloomFilter.expectedFalsePositiveRate(filterWithItems, 200);
});

await run();
console.log("");

// =============================================================================
// 9. Batch operations - Add multiple items
// =============================================================================

console.log("9. Batch operations - Add 100 items");
console.log("-".repeat(80));

bench("BloomFilter.add - 100 items", () => {
	const f = BloomFilter.create(2048, 3);
	for (let i = 0; i < 100; i++) {
		BloomFilter.add(f, encoder.encode(`item${i}`));
	}
});

await run();
console.log("");

// =============================================================================
// 10. Batch operations - Check 1000 items
// =============================================================================

console.log("10. Batch operations - Check 1000 items");
console.log("-".repeat(80));

const filterFor1000 = BloomFilter.create(2048, 3);
for (let i = 0; i < 100; i++) {
	BloomFilter.add(filterFor1000, encoder.encode(`item${i}`));
}

bench("BloomFilter.contains - 1000 checks", () => {
	for (let i = 0; i < 1000; i++) {
		BloomFilter.contains(filterFor1000, encoder.encode(`item${i}`));
	}
});

await run();
console.log("");

// =============================================================================
// 11. Edge cases - Empty filter operations
// =============================================================================

console.log("11. Edge cases - Empty filter operations");
console.log("-".repeat(80));

const emptyCheck = BloomFilter.create(2048, 3);

bench("Empty filter - contains check", () => {
	BloomFilter.contains(emptyCheck, testItem);
});

bench("Empty filter - isEmpty", () => {
	BloomFilter.isEmpty(emptyCheck);
});

bench("Empty filter - density", () => {
	BloomFilter.density(emptyCheck);
});

await run();
console.log("");

// =============================================================================
// 12. Edge cases - Full filter operations
// =============================================================================

console.log("12. Edge cases - Full filter operations");
console.log("-".repeat(80));

bench("Full filter - contains check", () => {
	BloomFilter.contains(fullFilter, testItem);
});

bench("Full filter - isEmpty", () => {
	BloomFilter.isEmpty(fullFilter);
});

bench("Full filter - density", () => {
	BloomFilter.density(fullFilter);
});

await run();
console.log("");

console.log("=".repeat(80));
console.log("BloomFilter Benchmarks Complete");
console.log("=".repeat(80));
