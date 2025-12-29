import { Address } from "@tevm/voltaire";
// Example: Sort and deduplicate addresses
const addr1 = Address("0x0000000000000000000000000000000000000003");
const addr2 = Address("0x0000000000000000000000000000000000000001");
const addr3 = Address("0x0000000000000000000000000000000000000002");
const addr4 = Address("0x0000000000000000000000000000000000000001"); // Duplicate

const addresses = [addr1, addr2, addr3, addr4];

// Sort addresses lexicographically
const sorted = Address.sortAddresses(addresses);
sorted.forEach((_addr) => {});

// Remove duplicates
const unique = Address.deduplicateAddresses(addresses);
unique.forEach((_addr) => {});

// Combine: sort and deduplicate
const cleanList = Address.deduplicateAddresses(
	Address.sortAddresses(addresses),
);
cleanList.forEach((_addr) => {});
