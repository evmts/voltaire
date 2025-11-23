import * as Hex from "../../../primitives/Hex/index.js";

// Pad hex to specified size (left padding with zeros)
const hex = Hex.from("0x1234");
console.log("Original:", hex.toString());
console.log("Size:", hex.size(), "bytes");

// Pad to 32 bytes (uint256)
const padded32 = hex.pad(32);
console.log("\nPadded to 32 bytes:", padded32.toString());
console.log("Size:", padded32.size(), "bytes");

// Pad to 4 bytes
const padded4 = hex.pad(4);
console.log("\nPadded to 4 bytes:", padded4.toString());
console.log("Size:", padded4.size(), "bytes");

// Right padding (pad on right side)
const rightPadded = hex.padRight(32);
console.log("\nRight padded to 32 bytes:", rightPadded.toString());
console.log("Size:", rightPadded.size(), "bytes");

// Already correct size (no padding)
const correct = Hex.from("0x12345678");
const unchanged = correct.pad(4);
console.log("\nAlready 4 bytes:", correct.toString());
console.log("After pad:", unchanged.toString());
console.log("Unchanged:", correct.toString() === unchanged.toString());

// Address padding (20 bytes to 32 bytes)
const address = Hex.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const addressPadded = address.pad(32);
console.log("\nAddress:", address.toString());
console.log("Padded to 32 bytes:", addressPadded.toString());
