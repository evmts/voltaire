import * as Address from "../../../primitives/Address/index.js";

// Example: Compare addresses lexicographically
const addr1 = Address.from("0x0000000000000000000000000000000000000001");
const addr2 = Address.from("0x0000000000000000000000000000000000000002");
const addr3 = Address.from("0x0000000000000000000000000000000000000001");

// compare returns: -1 if less, 0 if equal, 1 if greater
console.log("addr1 < addr2:", addr1.compare(addr2)); // -1
console.log("addr2 > addr1:", addr2.compare(addr1)); // 1
console.log("addr1 == addr3:", addr1.compare(addr3)); // 0

// Convenience methods
console.log("addr1.lessThan(addr2):", addr1.lessThan(addr2));
console.log("addr2.greaterThan(addr1):", addr2.greaterThan(addr1));

// Sort addresses
const addrs = [addr2, addr1, addr3];
const sorted = Address.sortAddresses(addrs);
console.log("Sorted addresses:");
sorted.forEach((addr) => console.log("  " + addr.toHex()));
