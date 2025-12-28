import * as Address from "../../../primitives/Address/index.js";

// Example: Compare addresses lexicographically
const addr1 = Address.from("0x0000000000000000000000000000000000000001");
const addr2 = Address.from("0x0000000000000000000000000000000000000002");
const addr3 = Address.from("0x0000000000000000000000000000000000000001");

// Sort addresses
const addrs = [addr2, addr1, addr3];
const sorted = Address.sortAddresses(addrs);
sorted.forEach((addr) => console.log(Address.toHex(addr)));
