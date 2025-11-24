import * as Address from "../../../primitives/Address/index.js";

// Example: Convert address to U256 (bigint)
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Convert to bigint (U256)
const u256 = addr.toU256();

// Useful for numeric operations
const addr2 = Address.from("0x0000000000000000000000000000000000000001");
const u256_2 = addr2.toU256();

// Can convert back to address
const backToAddr = Address.fromNumber(u256);

// Instance method
const instance = Address.Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
