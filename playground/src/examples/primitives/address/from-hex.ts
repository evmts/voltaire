import * as Address from "../../../primitives/Address/index.js";

// Example: Create address from hex string
// Accepts various hex formats
const addr1 = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("With 0x prefix:", addr1.toHex());

const addr2 = Address.fromHex("742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("Without 0x prefix:", addr2.toHex());

// Case insensitive
const addr3 = Address.fromHex("0x742D35CC6634C0532925A3B844BC454E4438F44E");
console.log("Uppercase:", addr3.toHex());

// All produce same address
console.log(
	"All equal:",
	addr1.equals(addr2) && addr2.equals(addr3),
);

// Checksummed addresses work too
const checksummed = Address.fromHex(
	"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
);
console.log("Checksummed:", checksummed.toHex());
