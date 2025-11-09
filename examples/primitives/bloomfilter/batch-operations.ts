// Demonstrate efficient batch operations with bloom filters
import {
	BITS,
	BloomFilter,
	DEFAULT_HASH_COUNT,
} from "../../../src/primitives/BloomFilter/index.js";

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

const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

const events = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
	"Swap(address,uint256,uint256,uint256,uint256,address)",
	"Mint(address,uint256,uint256)",
	"Burn(address,uint256,uint256,address)",
];
batchAdd(filter, events);
const queries = [
	"Transfer(address,address,uint256)",
	"Approval(address,address,uint256)",
	"Sync(uint112,uint112)", // Not added
	"Mint(address,uint256,uint256)",
];

const results = batchContains(filter, queries);
for (let i = 0; i < queries.length; i++) {}

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
batchAdd(watchlistFilter, addresses);
const testAddresses = ["address1", "address5", "address99", "address10"];
const watchResults = batchContains(watchlistFilter, testAddresses);

for (let i = 0; i < testAddresses.length; i++) {}

const seenFilter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
const items = ["tx1", "tx2", "tx1", "tx3", "tx2", "tx4", "tx1"];
const uniqueItems: string[] = [];
const encoder = new TextEncoder();
for (const item of items) {
	const itemBytes = encoder.encode(item);
	if (!seenFilter.contains(itemBytes)) {
		seenFilter.add(itemBytes);
		uniqueItems.push(item);
	} else {
	}
}

const batchFilter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
const testItems = Array.from({ length: 1000 }, (_, i) => `item-${i}`);

// Measure batch add
const batchStart = performance.now();
batchAdd(batchFilter, testItems);
const batchTime = performance.now() - batchStart;

// Measure batch check
const checkStart = performance.now();
const checkResults = batchContains(batchFilter, testItems.slice(0, 100));
const checkTime = performance.now() - checkStart;

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
