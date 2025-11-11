// Demonstrate merging multiple bloom filters for range queries
import {
	BITS,
	BloomFilter,
	DEFAULT_HASH_COUNT,
} from "../../../src/primitives/BloomFilter/index.js";

// Create filters for simulated "blocks"
const encoder = new TextEncoder();

const block1Filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
block1Filter.add(encoder.encode("address1"));
block1Filter.add(encoder.encode("Transfer"));
block1Filter.add(encoder.encode("topic1"));

const block2Filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
block2Filter.add(encoder.encode("address2"));
block2Filter.add(encoder.encode("Approval"));
block2Filter.add(encoder.encode("topic2"));

const block3Filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
block3Filter.add(encoder.encode("address3"));
block3Filter.add(encoder.encode("Swap"));
block3Filter.add(encoder.encode("topic3"));
const merged12 = block1Filter.merge(block2Filter);
const filters = [block1Filter, block2Filter, block3Filter];
const rangeFilter = filters.reduce(
	(acc, filter) => acc.merge(filter),
	BloomFilter.create(BITS, DEFAULT_HASH_COUNT),
);
const nonMember = encoder.encode("Burn");
if (!rangeFilter.contains(nonMember)) {
	// Non-member correctly not found
} else {
	// False positive
}
const transferBytes = encoder.encode("Transfer");

// Quick check with merged filter
if (rangeFilter.contains(transferBytes)) {
	// Found in merged filter, check individual blocks
	if (block1Filter.contains(transferBytes)) {
		// Found in block 1
	}
	if (block2Filter.contains(transferBytes)) {
		// Found in block 2
	}
	if (block3Filter.contains(transferBytes)) {
		// Found in block 3
	}
} else {
	// Not found in range
}
