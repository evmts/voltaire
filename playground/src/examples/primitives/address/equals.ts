import * as Address from "../../../primitives/Address/index.js";

// Example: Compare addresses for equality
const addr1 = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const addr2 = Address.from("0x742d35cc6634c0532925a3b844bc454e4438f44e");
const addr3 = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

// Compare using static method
console.log("addr1 == addr2:", Address.equals(addr1, addr2));
console.log("addr1 == addr3:", Address.equals(addr1, addr3));

// Compare using instance method
const instance = Address.Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("instance.equals(addr2):", instance.equals(addr2));

// Checksum doesn't affect equality - only the bytes matter
const checksummed = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const lowercase = Address.from("0x742d35cc6634c0532925a3b844bc454e4438f44e");
console.log("Checksum irrelevant:", Address.equals(checksummed, lowercase));
