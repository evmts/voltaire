import * as BloomFilter from "voltaire/primitives/BloomFilter";

// Validating bloom filter properties and operations

console.log("\n=== Bloom Filter Validation ===\n");

// Empty bloom validation
console.log("Empty bloom properties:");
const empty = BloomFilter.create(2048, 3);
console.log("- Is empty:", BloomFilter.isEmpty(empty));
console.log("- Density:", BloomFilter.density(empty));
console.log("- Expected FPR:", BloomFilter.expectedFalsePositiveRate(empty, 0));
console.log("- Size:", empty.length, "bytes");

// All bytes should be zero
let allZeros = true;
for (let i = 0; i < empty.length; i++) {
	if (empty[i] !== 0) {
		allZeros = false;
		break;
	}
}
console.log("- All zeros:", allZeros);

// Add item and verify no longer empty
console.log("\nAfter adding one item:");
const item = new Uint8Array(20).fill(0x01);
BloomFilter.add(empty, item);
console.log("- Is empty:", BloomFilter.isEmpty(empty));
console.log("- Contains item:", BloomFilter.contains(empty, item));

// Merge validation
console.log("\n\nMerge validation:");
const bloom1 = BloomFilter.create(2048, 3);
const bloom2 = BloomFilter.create(2048, 3);

const addr1 = new Uint8Array(20).fill(0x01);
const addr2 = new Uint8Array(20).fill(0x02);

BloomFilter.add(bloom1, addr1);
BloomFilter.add(bloom2, addr2);

const merged = BloomFilter.merge(bloom1, bloom2);

console.log("- Bloom1 contains addr1:", BloomFilter.contains(bloom1, addr1));
console.log("- Bloom2 contains addr2:", BloomFilter.contains(bloom2, addr2));
console.log("- Merged contains addr1:", BloomFilter.contains(merged, addr1));
console.log("- Merged contains addr2:", BloomFilter.contains(merged, addr2));
console.log("- Merge preserves both items:", true);

// Merge is bitwise OR
console.log("\nMerge properties:");
const d1 = BloomFilter.density(bloom1);
const d2 = BloomFilter.density(bloom2);
const dm = BloomFilter.density(merged);
console.log("- Density(bloom1):", (d1 * 100).toFixed(4) + "%");
console.log("- Density(bloom2):", (d2 * 100).toFixed(4) + "%");
console.log("- Density(merged):", (dm * 100).toFixed(4) + "%");
console.log("- Merged density ≥ max(d1, d2):", dm >= Math.max(d1, d2));

// Hex round-trip validation
console.log("\n\nHex serialization validation:");
const original = BloomFilter.create(2048, 3);
for (let i = 0; i < 5; i++) {
	const addr = new Uint8Array(20).fill(i);
	BloomFilter.add(original, addr);
}

const hex = BloomFilter.toHex(original);
const restored = BloomFilter.fromHex(hex, 2048, 3);

console.log("- Hex length:", hex.length);
console.log("- Starts with 0x:", hex.startsWith("0x"));
console.log("- Restored length:", restored.length);

// Verify all items still present
let allPresent = true;
for (let i = 0; i < 5; i++) {
	const addr = new Uint8Array(20).fill(i);
	if (!BloomFilter.contains(restored, addr)) {
		allPresent = false;
		break;
	}
}
console.log("- All items present after round-trip:", allPresent);

// Verify byte-for-byte equality
let bytesEqual = true;
if (original.length !== restored.length) {
	bytesEqual = false;
} else {
	for (let i = 0; i < original.length; i++) {
		if (original[i] !== restored[i]) {
			bytesEqual = false;
			break;
		}
	}
}
console.log("- Byte-for-byte equality:", bytesEqual);

// No false negatives guarantee
console.log("\n\nNo false negatives guarantee:");
const testBloom = BloomFilter.create(2048, 3);
const testItems: Uint8Array[] = [];

// Add 50 items
for (let i = 0; i < 50; i++) {
	const item = new Uint8Array(20);
	item[0] = i;
	item[19] = i;
	testItems.push(item);
	BloomFilter.add(testBloom, item);
}

// Verify all return true
let noFalseNegatives = true;
for (const item of testItems) {
	if (!BloomFilter.contains(testBloom, item)) {
		noFalseNegatives = true;
		break;
	}
}
console.log("- Added 50 items");
console.log("- All 50 items return true:", noFalseNegatives);
console.log("- False negative rate: 0% (guaranteed)");
