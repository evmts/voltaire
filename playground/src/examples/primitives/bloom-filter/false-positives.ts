import * as BloomFilter from "voltaire/primitives/BloomFilter";

// Understanding false positive rates in bloom filters

console.log("\n=== False Positive Rates ===\n");

// False positive probability formula: (1 - e^(-kn/m))^k
// where k = hash functions, n = items added, m = bits in filter

console.log("Theoretical false positive rates:");
console.log("For Ethereum bloom filter (m=2048, k=3):\n");

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

	console.log(`n = ${n} items:`);
	console.log(`  - Density: ${(density * 100).toFixed(2)}%`);
	console.log(`  - Expected FPR: ${(fpr * 100).toFixed(4)}%`);
}

// Empirical false positive rate
console.log("\nEmpirical false positive test:");
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

console.log(`- Added: 100 items`);
console.log(`- Tested: ${testCount} items not in filter`);
console.log(`- False positives: ${falsePositives}`);
console.log(`- Empirical FPR: ${(empiricalFpr * 100).toFixed(4)}%`);
console.log(`- Expected FPR: ${(expectedFpr * 100).toFixed(4)}%`);

// Implications for Ethereum
console.log("\nImplications for Ethereum:");
console.log("- Block with 100 logs:");
console.log("  → ~1.5% chance of false positive on random address query");
console.log("  → Must verify actual logs when bloom returns true");
console.log("- Dense block with 500 logs:");
console.log("  → ~35% chance of false positive");
console.log("  → Still faster than checking all logs");
console.log("\n- False negative probability: 0% (guaranteed)");
console.log("  → If bloom returns false, can skip block entirely");
