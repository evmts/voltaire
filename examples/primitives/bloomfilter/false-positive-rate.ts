// Demonstrate false positive rates and parameter selection
import { BloomFilter } from "../../../src/primitives/BloomFilter/index.js";

// Test false positive rate with different parameters
function testFalsePositiveRate(
	m: number,
	k: number,
	numItems: number,
	testItems: number,
) {
	const filter = BloomFilter.create(m, k);

	// Add known items
	const encoder = new TextEncoder();
	for (let i = 0; i < numItems; i++) {
		filter.add(encoder.encode(`item-${i}`));
	}

	// Test items that were NOT added
	let falsePositives = 0;
	for (let i = numItems; i < numItems + testItems; i++) {
		if (filter.contains(encoder.encode(`item-${i}`))) {
			falsePositives++;
		}
	}

	const fpRate = falsePositives / testItems;
	const theoretical = (1 - Math.exp((-k * numItems) / m)) ** k;
}
testFalsePositiveRate(2048, 3, 10, 1000);
testFalsePositiveRate(2048, 3, 50, 1000);
testFalsePositiveRate(2048, 3, 100, 1000);
testFalsePositiveRate(2048, 3, 200, 1000);
testFalsePositiveRate(4096, 5, 50, 1000);
testFalsePositiveRate(4096, 5, 100, 1000);
testFalsePositiveRate(512, 2, 20, 1000);
testFalsePositiveRate(512, 2, 50, 1000);

// Demonstrate optimal k calculation
function computeOptimalK(m: number, n: number): number {
	return Math.ceil((m / n) * Math.log(2));
}
