// Demonstrate efficient batch operations with bloom filters
import {
	BloomFilter,
	BITS,
	DEFAULT_HASH_COUNT,
} from "../../../src/primitives/BloomFilter/index.js";

console.log("Bloom Filter Batch Operations\n");

// Batch add multiple items
function batchAdd(filter: typeof BloomFilter.prototype, items: string[]): void {
	const encoder = new TextEncoder();
	for (const item of items) {
		filter.add(encoder.encode(item));
	}
}

// Batch check multiple items
function batchContains(
	filter: typeof BloomFilter.prototype,
	items: string[],
): boolean[] {
	const encoder = new TextEncoder();
	return items.map((item) => filter.contains(encoder.encode(item)));
}

// Example 1: Building event index
console.log("Example 1: Building event index for block");

const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

const events = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
	"Swap(address,uint256,uint256,uint256,uint256,address)",
	"Mint(address,uint256,uint256)",
	"Burn(address,uint256,uint256,address)",
];

console.log(`Adding ${events.length} event signatures...`);
batchAdd(filter, events);

console.log("\nChecking which events might be present:");
const queries = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
	"Sync(uint112,uint112)", // Not added
	"Mint(address,uint256,uint256)",
];

const results = batchContains(filter, queries);
for (let i = 0; i < queries.length; i++) {
	console.log(
		`  ${queries[i]}: ${results[i] ? "✓ might exist" : "✗ definitely not present"}`,
	);
}

// Example 2: Multi-address watchlist
console.log("\nExample 2: Multi-address watchlist");

const watchlistFilter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

const addresses = [
	"address1",
	"address2",
	"address3",
	"address4",
	"address5",
	"address6",
	"address7",
	"address8",
	"address9",
	"address10",
];

console.log(`Adding ${addresses.length} addresses to watchlist...`);
batchAdd(watchlistFilter, addresses);

console.log("\nChecking if addresses are watched:");
const testAddresses = ["address1", "address5", "address99", "address10"];
const watchResults = batchContains(watchlistFilter, testAddresses);

for (let i = 0; i < testAddresses.length; i++) {
	console.log(
		`  ${testAddresses[i]}: ${watchResults[i] ? "watched ✓" : "not watched ✗"}`,
	);
}

// Example 3: Deduplication check
console.log("\nExample 3: Deduplication with bloom filter");

const seenFilter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
const items = ["tx1", "tx2", "tx1", "tx3", "tx2", "tx4", "tx1"];
const uniqueItems: string[] = [];
const encoder = new TextEncoder();

console.log("Processing items with deduplication:");
for (const item of items) {
	const itemBytes = encoder.encode(item);
	if (!seenFilter.contains(itemBytes)) {
		// Might be new (could be false positive)
		console.log(`  ${item}: first occurrence (or false positive)`);
		seenFilter.add(itemBytes);
		uniqueItems.push(item);
	} else {
		// Definitely seen before
		console.log(`  ${item}: duplicate (skipped)`);
	}
}

console.log(`\nUnique items collected: ${uniqueItems.join(", ")}`);
console.log(
	"Note: bloom filter may have false positives, verify duplicates if needed",
);

// Example 4: Performance comparison
console.log("\nExample 4: Performance comparison - batch vs individual");

const batchFilter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
const testItems = Array.from({ length: 1000 }, (_, i) => `item-${i}`);

// Measure batch add
const batchStart = performance.now();
batchAdd(batchFilter, testItems);
const batchTime = performance.now() - batchStart;

console.log(`Batch add 1000 items: ${batchTime.toFixed(2)}ms`);

// Measure batch check
const checkStart = performance.now();
const checkResults = batchContains(batchFilter, testItems.slice(0, 100));
const checkTime = performance.now() - checkStart;

console.log(`Batch check 100 items: ${checkTime.toFixed(2)}ms`);
console.log(`All items found: ${checkResults.every((r) => r)}`);

// Show filter density
const totalBits = batchFilter.m;
let setBits = 0;
for (let i = 0; i < batchFilter.length; i++) {
	const byte = batchFilter[i];
	for (let bit = 0; bit < 8; bit++) {
		if (byte & (1 << bit)) setBits++;
	}
}
const density = ((setBits / totalBits) * 100).toFixed(2);
console.log(`\nFilter density: ${density}% (${setBits}/${totalBits} bits set)`);
