import * as BloomFilter from "voltaire/primitives/BloomFilter";
import {
	BITS,
	DEFAULT_HASH_COUNT,
	SIZE,
} from "voltaire/primitives/BloomFilter";

// Creating bloom filters with different configurations

console.log("\n=== Creating Bloom Filters ===\n");

// Standard Ethereum bloom filter
console.log("Standard Ethereum bloom filter:");
const ethBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
console.log("- Bits:", BITS);
console.log("- Size:", SIZE, "bytes");
console.log("- Hash functions:", DEFAULT_HASH_COUNT);
console.log("- Buffer length:", ethBloom.length);
console.log("- All zeros:", BloomFilter.isEmpty(ethBloom));

// Create from hex string
const hexStr =
	"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
const fromHex = BloomFilter.fromHex(hexStr, BITS, DEFAULT_HASH_COUNT);
console.log("\nCreated from hex:");
console.log("- Length:", fromHex.length, "bytes");
console.log("- Is empty:", BloomFilter.isEmpty(fromHex));

// Verify sizes match
console.log("\nVerifying Ethereum spec:");
console.log("- BITS =", BITS);
console.log("- SIZE =", SIZE);
console.log("- SIZE * 8 =", SIZE * 8);
console.log("- BITS === SIZE * 8:", BITS === SIZE * 8);
console.log("- DEFAULT_HASH_COUNT =", DEFAULT_HASH_COUNT);

// Each item sets up to 3 bits
console.log("\nBit setting behavior:");
const testBloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
const item = new TextEncoder().encode("test");

function countSetBits(filter: Uint8Array): number {
	let count = 0;
	for (let i = 0; i < filter.length; i++) {
		let byte = filter[i] as number;
		while (byte > 0) {
			count += byte & 1;
			byte >>= 1;
		}
	}
	return count;
}

const beforeBits = countSetBits(testBloom);
BloomFilter.add(testBloom, item);
const afterBits = countSetBits(testBloom);
const bitsSet = afterBits - beforeBits;

console.log("- Before:", beforeBits, "bits set");
console.log("- After:", afterBits, "bits set");
console.log("- Difference:", bitsSet, "bits (≤ 3 due to k=3 hash functions)");
