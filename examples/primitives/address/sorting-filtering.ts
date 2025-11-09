/**
 * Address Sorting and Filtering Example
 *
 * Demonstrates:
 * - Sorting addresses lexicographically
 * - Filtering addresses (zero addresses, ranges, sets)
 * - Deduplication and uniqueness
 * - Comparison operations
 * - Working with address collections
 */

import { Address } from "../../../src/primitives/Address/index.js";

console.log("=== Address Sorting and Filtering ===\n");

// 1. Sorting addresses
console.log("1. Sorting Addresses\n");

const unsorted = [
	Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff"),
	Address.fromHex("0x0000000000000000000000000000000000000001"),
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Address.fromHex("0x0000000000000000000000000000000000000000"),
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
];

console.log("Unsorted:");
unsorted.forEach((addr) => console.log(`  ${addr.toChecksummed()}`));
console.log();

// Sort ascending
const ascending = [...unsorted].sort((a, b) => a.compare(b));
console.log("Sorted (ascending):");
ascending.forEach((addr) => console.log(`  ${addr.toChecksummed()}`));
console.log();

// Sort descending
const descending = [...unsorted].sort((a, b) => b.compare(a));
console.log("Sorted (descending):");
descending.forEach((addr) => console.log(`  ${addr.toChecksummed()}`));
console.log();

// 2. Filtering zero addresses
console.log("2. Filtering Zero Addresses\n");

const addresses = [
	Address.zero(),
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	new Address(0n),
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
	Address.fromHex("0x0000000000000000000000000000000000000000"),
];

console.log("All addresses:");
addresses.forEach((addr) => {
	console.log(`  ${addr.toChecksummed()} ${addr.isZero() ? "(zero)" : ""}`);
});
console.log();

const nonZero = addresses.filter((addr) => !addr.isZero());
console.log(`Non-zero addresses (${nonZero.length}):)`);
nonZero.forEach((addr) => console.log(`  ${addr.toChecksummed()}`));
console.log();

// 3. Range filtering
console.log("3. Range Filtering\n");

const allAddresses = [
	new Address(10n),
	new Address(50n),
	new Address(100n),
	new Address(200n),
	new Address(500n),
];

const min = new Address(50n);
const max = new Address(200n);

console.log(`Range: ${min.toHex()} to ${max.toHex()}`);
console.log();

const inRange = allAddresses.filter(
	(addr) => !addr.lessThan(min) && !addr.greaterThan(max),
);

console.log("Addresses in range:");
inRange.forEach((addr) => console.log(`  ${addr.toHex()}`));
console.log();

// 4. Deduplication
console.log("4. Deduplication\n");

const withDuplicates = [
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
	Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"), // Duplicate (different case)
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"), // Duplicate (exact)
	Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
];

console.log(`Original (${withDuplicates.length} addresses):`);
withDuplicates.forEach((addr) => console.log(`  ${addr.toChecksummed()}`));
console.log();

// Method 1: Using findIndex
const unique1 = withDuplicates.filter(
	(addr, i, arr) => arr.findIndex((a) => a.equals(addr)) === i,
);

console.log(`Deduplicated (${unique1.length} addresses):`);
unique1.forEach((addr) => console.log(`  ${addr.toChecksummed()}`));
console.log();

// Method 2: Using Set with hex representation
const hexSet = new Set<string>();
const unique2 = withDuplicates.filter((addr) => {
	const hex = addr.toHex();
	if (hexSet.has(hex)) return false;
	hexSet.add(hex);
	return true;
});

console.log(`Deduplicated with Set (${unique2.length} addresses):`);
unique2.forEach((addr) => console.log(`  ${addr.toChecksummed()}`));
console.log();

// 5. Finding specific addresses
console.log("5. Finding Specific Addresses\n");

const addressList = [
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
	Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
];

const target = Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e");

// Find index
const index = addressList.findIndex((addr) => addr.equals(target));
console.log(`Target: ${target.toChecksummed()}`);
console.log(`Found at index: ${index}`);
console.log();

// Check if exists
const exists = addressList.some((addr) => addr.equals(target));
console.log(`Exists in list: ${exists}`);
console.log();

// 6. Grouping by prefix
console.log("6. Grouping by Prefix\n");

const mixedAddresses = [
	Address.fromHex("0x0000000000000000000000000000000000000001"),
	Address.fromHex("0x0000000000000000000000000000000000000002"),
	Address.fromHex("0x1111111111111111111111111111111111111111"),
	Address.fromHex("0x1111111111111111111111111111111111111112"),
	Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff"),
];

const grouped = new Map<number, Address[]>();

for (const addr of mixedAddresses) {
	const firstByte = addr[0]; // First byte determines group
	if (!grouped.has(firstByte)) {
		grouped.set(firstByte, []);
	}
	grouped.get(firstByte)!.push(addr);
}

console.log("Grouped by first byte:");
for (const [byte, addrs] of grouped.entries()) {
	console.log(
		`  0x${byte.toString(16).padStart(2, "0")}: ${addrs.length} addresses`,
	);
	addrs.forEach((addr) => console.log(`    ${addr.toChecksummed()}`));
}
console.log();

// 7. Top N addresses
console.log("7. Top N Addresses (Largest Values)\n");

const manyAddresses = [
	new Address(100n),
	new Address(500n),
	new Address(50n),
	new Address(1000n),
	new Address(200n),
	new Address(750n),
];

const topN = 3;
const largest = [...manyAddresses]
	.sort((a, b) => b.compare(a)) // Descending
	.slice(0, topN);

console.log(`Top ${topN} addresses:`);
largest.forEach((addr, i) => {
	console.log(`  ${i + 1}. ${addr.toHex()} (${addr.toU256()})`);
});
console.log();

// 8. Building address index/map
console.log("8. Building Address Index\n");

interface AddressMetadata {
	label: string;
	category: string;
}

const addressIndex = new Map<string, AddressMetadata>();

function addToIndex(addr: Address, meta: AddressMetadata) {
	addressIndex.set(addr.toHex(), meta);
}

function lookupAddress(addr: Address): AddressMetadata | undefined {
	return addressIndex.get(addr.toHex());
}

// Add addresses
addToIndex(Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"), {
	label: "Treasury",
	category: "Protocol",
});
addToIndex(Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"), {
	label: "Deployer",
	category: "Admin",
});

// Lookup
const lookupAddr = Address.fromHex(
	"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
);
const metadata = lookupAddress(lookupAddr);
console.log(`Address: ${lookupAddr.toChecksummed()}`);
console.log(`Metadata: ${metadata ? JSON.stringify(metadata) : "Not found"}`);
console.log();

// 9. Performance note
console.log("9. Performance Note\n");
console.log("For optimal performance when working with collections:");
console.log("- Use Map<string, T> with address.toHex() as key for lookups");
console.log("- Use address.compare() for sorting (returns -1/0/1)");
console.log("- Use address.equals() for exact matching");
console.log("- Convert to hex once and reuse for multiple operations");
