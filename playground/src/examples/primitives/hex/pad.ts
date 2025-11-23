import * as Hex from "../../../primitives/Hex/index.js";

// Pad hex to specified size (left padding with zeros)
const hex = "0x1234";
console.log("Original:", hex);
console.log("Size:", Hex.size(hex), "bytes");

// Pad to 32 bytes (uint256)
const padded32 = Hex.pad(hex, 32);
console.log("\nPadded to 32 bytes:", padded32);
console.log("Size:", Hex.size(padded32), "bytes");

// Pad to 4 bytes
const padded4 = Hex.pad(hex, 4);
console.log("\nPadded to 4 bytes:", padded4);
console.log("Size:", Hex.size(padded4), "bytes");

// Right padding (pad on right side)
const rightPadded = Hex.padRight(hex, 32);
console.log("\nRight padded to 32 bytes:", rightPadded);
console.log("Size:", Hex.size(rightPadded), "bytes");

// Already correct size (no padding)
const correct = "0x12345678";
const unchanged = Hex.pad(correct, 4);
console.log("\nAlready 4 bytes:", correct);
console.log("After pad:", unchanged);
console.log("Unchanged:", correct === unchanged);

// Address padding (20 bytes to 32 bytes)
const address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const addressPadded = Hex.pad(address, 32);
console.log("\nAddress:", address);
console.log("Padded to 32 bytes:", addressPadded);
