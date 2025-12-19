import * as BloomFilter from "voltaire/primitives/BloomFilter";

// Create empty bloom filter
const bloom = BloomFilter.create(2048, 3);

// Add Ethereum address (20 bytes)
const address = new Uint8Array([
	0xa0, 0xb8, 0x69, 0x91, 0xc6, 0x21, 0x8b, 0x36, 0xc1, 0xd1, 0x9d, 0x4a, 0x2e,
	0x9e, 0xb0, 0xce, 0x36, 0x06, 0xeb, 0x48,
]);
BloomFilter.add(bloom, address);

// Add event signature (32 bytes) - Transfer(address,address,uint256)
const transferSig = new Uint8Array([
	0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68, 0xfc,
	0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16, 0x28, 0xf5,
	0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
]);
BloomFilter.add(bloom, transferSig);

// Check item not in filter
const otherAddress = new Uint8Array(20).fill(0xff);

// Bloom density (percentage of set bits)
const d = BloomFilter.density(bloom);

// False positive rate (estimate for 2 items added)
const fpr = BloomFilter.expectedFalsePositiveRate(bloom, 2);

// Convert to hex (for storage in block headers/receipts)
const hex = BloomFilter.toHex(bloom);

// Reconstruct from hex (must provide m and k parameters)
const reconstructed = BloomFilter.fromHex(hex, 2048, 3);
