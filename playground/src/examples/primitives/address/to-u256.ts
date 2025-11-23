import * as Address from "../../../primitives/Address/index.js";

// Example: Convert address to U256 (bigint)
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Convert to bigint (U256)
const u256 = Address.toU256(addr);
console.log("As bigint:", u256);
console.log("As hex:", "0x" + u256.toString(16));

// Useful for numeric operations
const addr2 = Address.from("0x0000000000000000000000000000000000000001");
const u256_2 = Address.toU256(addr2);
console.log("Small address as bigint:", u256_2);

// Can convert back to address
const backToAddr = Address.fromNumber(u256);
console.log("Back to address:", Address.toHex(backToAddr));
console.log("Round-trip success:", Address.equals(addr, backToAddr));

// Instance method
const instance = Address.Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("Via instance:", instance.toU256());
