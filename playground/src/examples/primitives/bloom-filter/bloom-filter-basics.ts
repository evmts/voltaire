import * as BloomFilter from "voltaire/primitives/BloomFilter";

// Ethereum bloom filter: 256 bytes (2048 bits), 3 hash functions
// Used in block headers and transaction receipts for efficient log filtering

console.log("\n=== BloomFilter Basics ===\n");

// Create empty bloom filter
const bloom = BloomFilter.create(2048, 3);
console.log("Created bloom filter:");
console.log("- Size:", bloom.length, "bytes (256)");
console.log("- Bits:", 2048);
console.log("- Hash functions:", 3);
console.log("- Is empty:", BloomFilter.isEmpty(bloom));

// Add Ethereum address (20 bytes)
const address = new Uint8Array([
	0xa0, 0xb8, 0x69, 0x91, 0xc6, 0x21, 0x8b, 0x36, 0xc1, 0xd1, 0x9d, 0x4a, 0x2e,
	0x9e, 0xb0, 0xce, 0x36, 0x06, 0xeb, 0x48,
]);
BloomFilter.add(bloom, address);
console.log("\nAdded address to bloom filter");
console.log("- Contains address:", BloomFilter.contains(bloom, address));
console.log("- Is empty:", BloomFilter.isEmpty(bloom));

// Add event signature (32 bytes) - Transfer(address,address,uint256)
const transferSig = new Uint8Array([
	0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68, 0xfc,
	0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16, 0x28, 0xf5,
	0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
]);
BloomFilter.add(bloom, transferSig);
console.log("\nAdded Transfer event signature");
console.log("- Contains signature:", BloomFilter.contains(bloom, transferSig));

// Check item not in filter
const otherAddress = new Uint8Array(20).fill(0xff);
console.log("\nChecking address NOT in filter:");
console.log("- Contains:", BloomFilter.contains(bloom, otherAddress));
console.log(
	"- False means definite no - this address was never added to the filter",
);

// Bloom density (percentage of set bits)
const d = BloomFilter.density(bloom);
console.log("\nBloom filter density:", (d * 100).toFixed(4) + "%");
console.log(
	"- After adding 2 items, only ~" + (d * 100).toFixed(2) + "% of bits are set",
);

// False positive rate (estimate for 2 items added)
const fpr = BloomFilter.expectedFalsePositiveRate(bloom, 2);
console.log("\nFalse positive rate:", (fpr * 100).toFixed(6) + "%");
console.log(
	"- Probability of false positive (saying 'maybe' when item was never added)",
);

// Convert to hex (for storage in block headers/receipts)
const hex = BloomFilter.toHex(bloom);
console.log("\nHex representation (first 64 chars):");
console.log(hex.slice(0, 66) + "...");
console.log("- Full length:", hex.length, "chars (2 + 512)");

// Reconstruct from hex (must provide m and k parameters)
const reconstructed = BloomFilter.fromHex(hex, 2048, 3);
console.log("\nReconstructed from hex:");
console.log(
	"- Contains address:",
	BloomFilter.contains(reconstructed, address),
);
console.log(
	"- Contains signature:",
	BloomFilter.contains(reconstructed, transferSig),
);
