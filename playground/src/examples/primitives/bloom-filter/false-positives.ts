import { BloomFilter } from "voltaire";

const m = 2048;
const k = 3;

// Calculate expected false positive rate for different item counts
const itemCounts = [10, 50, 100, 200, 500];
for (const n of itemCounts) {
	// Create bloom and add n items
	const bloom = BloomFilter.create(m, k);
	for (let i = 0; i < n; i++) {
		const item = new Uint8Array(20);
		item[0] = i & 0xff;
		item[1] = (i >> 8) & 0xff;
		BloomFilter.add(bloom, item);
	}

	const density = BloomFilter.density(bloom);
	const fpr = BloomFilter.expectedFalsePositiveRate(bloom, n);
}
const testBloom = BloomFilter.create(m, k);

// Add 100 items
const addedItems = new Set<string>();
for (let i = 0; i < 100; i++) {
	const item = new Uint8Array(20);
	item[0] = i;
	item[19] = i;
	addedItems.add(item.join(","));
	BloomFilter.add(testBloom, item);
}

// Test 1000 items that weren't added
let falsePositives = 0;
const testCount = 1000;
for (let i = 100; i < 100 + testCount; i++) {
	const item = new Uint8Array(20);
	item[0] = i & 0xff;
	item[1] = (i >> 8) & 0xff;
	const key = item.join(",");

	if (!addedItems.has(key)) {
		if (BloomFilter.contains(testBloom, item)) {
			falsePositives++;
		}
	}
}

const empiricalFpr = falsePositives / testCount;
const expectedFpr = BloomFilter.expectedFalsePositiveRate(testBloom, 100);
