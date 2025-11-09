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

const unsorted = [
	Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff"),
	Address.fromHex("0x0000000000000000000000000000000000000001"),
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Address.fromHex("0x0000000000000000000000000000000000000000"),
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
];
unsorted.forEach((addr) => );

// Sort ascending
const ascending = [...unsorted].sort((a, b) => a.compare(b));
ascending.forEach((addr) => );

// Sort descending
const descending = [...unsorted].sort((a, b) => b.compare(a));
descending.forEach((addr) => );

const addresses = [
	Address.zero(),
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	new Address(0n),
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
	Address.fromHex("0x0000000000000000000000000000000000000000"),
];
addresses.forEach((addr) => {
});

const nonZero = addresses.filter((addr) => !addr.isZero());
nonZero.forEach((addr) => );

const allAddresses = [
	new Address(10n),
	new Address(50n),
	new Address(100n),
	new Address(200n),
	new Address(500n),
];

const min = new Address(50n);
const max = new Address(200n);

const inRange = allAddresses.filter(
	(addr) => !addr.lessThan(min) && !addr.greaterThan(max),
);
inRange.forEach((addr) => );

const withDuplicates = [
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
	Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"), // Duplicate (different case)
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"), // Duplicate (exact)
	Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
];
withDuplicates.forEach((addr) => );

// Method 1: Using findIndex
const unique1 = withDuplicates.filter(
	(addr, i, arr) => arr.findIndex((a) => a.equals(addr)) === i,
);
unique1.forEach((addr) => );

// Method 2: Using Set with hex representation
const hexSet = new Set<string>();
const unique2 = withDuplicates.filter((addr) => {
	const hex = addr.toHex();
	if (hexSet.has(hex)) return false;
	hexSet.add(hex);
	return true;
});
unique2.forEach((addr) => );

const addressList = [
	Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
	Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
];

const target = Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e");

// Find index
const index = addressList.findIndex((addr) => addr.equals(target));

// Check if exists
const exists = addressList.some((addr) => addr.equals(target));

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
	grouped.get(firstByte)?.push(addr);
}
for (const [byte, addrs] of grouped.entries()) {
	addrs.forEach((addr) => );
}

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
largest.forEach((addr, i) => {
});

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
