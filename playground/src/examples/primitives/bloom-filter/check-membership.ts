import * as BloomFilter from "voltaire/primitives/BloomFilter";

// Checking membership in bloom filter

console.log("\n=== Checking Membership ===\n");

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
console.log("Added 10 addresses to bloom filter\n");

// Check all added addresses - should all return true
console.log("Checking addresses that WERE added:");
let truePositives = 0;
for (let i = 0; i < addedAddresses.length; i++) {
	const contains = BloomFilter.contains(bloom, addedAddresses[i] as Uint8Array);
	if (contains) truePositives++;
	console.log(`- Address ${i + 1}:`, contains);
}
console.log(`✓ ${truePositives}/${addedAddresses.length} true positives`);

// Check addresses NOT added
console.log("\nChecking addresses that were NOT added:");
let trueNegatives = 0;
let falsePositives = 0;
for (let i = 100; i < 110; i++) {
	const addr = new Uint8Array(20);
	addr[0] = i;
	addr[19] = i;
	const contains = BloomFilter.contains(bloom, addr);
	if (!contains) {
		trueNegatives++;
		console.log(`- Address ${i}:`, contains, "✓ true negative");
	} else {
		falsePositives++;
		console.log(`- Address ${i}:`, contains, "⚠️  false positive");
	}
}
console.log(`\n✓ ${trueNegatives}/10 true negatives`);
console.log(`⚠️  ${falsePositives}/10 false positives`);

// Bloom filter guarantees
console.log("\nBloom filter guarantees:");
console.log(
	"1. No false negatives - if contains() returns false, item was NOT added",
);
console.log(
	"2. Possible false positives - if contains() returns true, item MIGHT have been added",
);
console.log("3. Must check actual data if contains() returns true");

// Use case: quick filtering
console.log("\nQuick filtering use case:");
const targetAddress = new Uint8Array(20);
targetAddress[0] = 5;
targetAddress[19] = 5;
const inBloom = BloomFilter.contains(bloom, targetAddress);

console.log("- Looking for specific address");
console.log("- Bloom contains:", inBloom);
if (inBloom) {
	console.log("  → MAYBE present, check actual logs/receipts");
} else {
	console.log("  → DEFINITELY not present, skip this block/receipt");
}
