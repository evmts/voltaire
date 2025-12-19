import * as Address from "../../../primitives/Address/index.js";

// Example: Sort and deduplicate addresses
const addr1 = Address.from("0x0000000000000000000000000000000000000003");
const addr2 = Address.from("0x0000000000000000000000000000000000000001");
const addr3 = Address.from("0x0000000000000000000000000000000000000002");
const addr4 = Address.from("0x0000000000000000000000000000000000000001"); // Duplicate

const addresses = [addr1, addr2, addr3, addr4];

// Sort addresses lexicographically
const sorted = Address.sortAddresses(addresses);
sorted.forEach((addr) => );

// Remove duplicates
const unique = Address.deduplicateAddresses(addresses);
unique.forEach((addr) => );

// Combine: sort and deduplicate
const cleanList = Address.deduplicateAddresses(
	Address.sortAddresses(addresses),
);
cleanList.forEach((addr) => );
