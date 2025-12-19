import * as BloomFilter from "voltaire/primitives/BloomFilter";

const bloom = BloomFilter.create(2048, 3);

// Add some addresses
const addedAddresses: Uint8Array[] = [];
for (let i = 1; i <= 10; i++) {
	const addr = new Uint8Array(20);
	addr[0] = i;
	addr[19] = i;
	addedAddresses.push(addr);
	BloomFilter.add(bloom, addr);
}
let truePositives = 0;
for (let i = 0; i < addedAddresses.length; i++) {
	const contains = BloomFilter.contains(bloom, addedAddresses[i] as Uint8Array);
	if (contains) truePositives++;
}
let trueNegatives = 0;
let falsePositives = 0;
for (let i = 100; i < 110; i++) {
	const addr = new Uint8Array(20);
	addr[0] = i;
	addr[19] = i;
	const contains = BloomFilter.contains(bloom, addr);
	if (!contains) {
		trueNegatives++;
	} else {
		falsePositives++;
	}
}
const targetAddress = new Uint8Array(20);
targetAddress[0] = 5;
targetAddress[19] = 5;
const inBloom = BloomFilter.contains(bloom, targetAddress);
if (inBloom) {
} else {
}
