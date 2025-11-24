import * as BloomFilter from "voltaire/primitives/BloomFilter";

// Adding different types of items to bloom filter

console.log("\n=== Adding Items to Bloom Filter ===\n");

const bloom = BloomFilter.create(2048, 3);

// Add Ethereum address (20 bytes)
console.log("Adding Ethereum address:");
const address = new Uint8Array([
	0x5a, 0xae, 0xd5, 0x93, 0x20, 0xb9, 0xeb, 0x3c, 0xd4, 0x62, 0xdd, 0xba, 0xef,
	0xa2, 0x1d, 0xa7, 0x57, 0xf3, 0x0f, 0xbd,
]);
BloomFilter.add(bloom, address);
console.log("- Added 20-byte address");
console.log("- Density:", (BloomFilter.density(bloom) * 100).toFixed(4) + "%");

// Add event topic (32 bytes)
console.log("\nAdding event topic:");
const topic = new Uint8Array(32);
topic[0] = 0xdd;
topic[1] = 0xf2;
topic[2] = 0x52;
topic[3] = 0xad;
BloomFilter.add(bloom, topic);
console.log("- Added 32-byte topic");
console.log("- Density:", (BloomFilter.density(bloom) * 100).toFixed(4) + "%");

// Add indexed address parameter (padded to 32 bytes)
console.log("\nAdding indexed address parameter:");
const indexedAddr = new Uint8Array(32);
// Left-padded with 12 zeros, address in last 20 bytes
for (let i = 0; i < 20; i++) {
	indexedAddr[12 + i] = i + 1;
}
BloomFilter.add(bloom, indexedAddr);
console.log("- Added 32-byte indexed address");
console.log("- Density:", (BloomFilter.density(bloom) * 100).toFixed(4) + "%");

// Add multiple items
console.log("\nAdding 100 random addresses:");
const beforeDensity = BloomFilter.density(bloom);
for (let i = 0; i < 100; i++) {
	const addr = new Uint8Array(20);
	addr[0] = i;
	addr[19] = i;
	BloomFilter.add(bloom, addr);
}
const afterDensity = BloomFilter.density(bloom);
console.log("- Density before:", (beforeDensity * 100).toFixed(4) + "%");
console.log("- Density after:", (afterDensity * 100).toFixed(4) + "%");
console.log(
	"- Increase:",
	((afterDensity - beforeDensity) * 100).toFixed(4) + "%",
);

// Verify all items are present
console.log("\nVerifying presence:");
console.log("- Contains address:", BloomFilter.contains(bloom, address));
console.log("- Contains topic:", BloomFilter.contains(bloom, topic));
console.log(
	"- Contains indexed addr:",
	BloomFilter.contains(bloom, indexedAddr),
);

// Check false positive
const notAdded = new Uint8Array(20).fill(0xff);
const maybePresent = BloomFilter.contains(bloom, notAdded);
console.log("\nChecking item NOT added:");
console.log("- Contains:", maybePresent);
if (maybePresent) {
	console.log(
		"  ⚠️  FALSE POSITIVE - bloom says 'maybe' but item was never added",
	);
} else {
	console.log("  ✓ Correct negative - item definitely not in filter");
}
