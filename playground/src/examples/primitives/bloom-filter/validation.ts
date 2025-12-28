import { BloomFilter } from "voltaire";
const empty = BloomFilter.create(2048, 3);

// All bytes should be zero
let allZeros = true;
for (let i = 0; i < empty.length; i++) {
	if (empty[i] !== 0) {
		allZeros = false;
		break;
	}
}
const item = new Uint8Array(20).fill(0x01);
BloomFilter.add(empty, item);
const bloom1 = BloomFilter.create(2048, 3);
const bloom2 = BloomFilter.create(2048, 3);

const addr1 = new Uint8Array(20).fill(0x01);
const addr2 = new Uint8Array(20).fill(0x02);

BloomFilter.add(bloom1, addr1);
BloomFilter.add(bloom2, addr2);

const merged = BloomFilter.merge(bloom1, bloom2);
const d1 = BloomFilter.density(bloom1);
const d2 = BloomFilter.density(bloom2);
const dm = BloomFilter.density(merged);
const original = BloomFilter.create(2048, 3);
for (let i = 0; i < 5; i++) {
	const addr = new Uint8Array(20).fill(i);
	BloomFilter.add(original, addr);
}

const hex = BloomFilter.toHex(original);
const restored = BloomFilter.fromHex(hex, 2048, 3);

// Verify all items still present
let allPresent = true;
for (let i = 0; i < 5; i++) {
	const addr = new Uint8Array(20).fill(i);
	if (!BloomFilter.contains(restored, addr)) {
		allPresent = false;
		break;
	}
}

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
