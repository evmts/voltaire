import * as Hex from "../../../primitives/Hex/index.js";

// Get size in bytes of hex strings
const hex1 = Hex.from("0x1234");
console.log("Hex:", hex1.toString());
console.log("Size:", hex1.size(), "bytes");
console.log("Characters (with 0x):", hex1.toString().length);

const hex2 = Hex.from("0xdeadbeef");
console.log("\nHex:", hex2.toString());
console.log("Size:", hex2.size(), "bytes");

// Address (20 bytes)
const address = Hex.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("\nAddress:", address.toString());
console.log("Size:", address.size(), "bytes");

// Hash (32 bytes)
const hash = Hex.from("0x" + "42".repeat(32));
console.log("\nHash:", hash.toString());
console.log("Size:", hash.size(), "bytes");

// Empty
const empty = Hex.from("0x");
console.log("\nEmpty:", empty.toString());
console.log("Size:", empty.size(), "bytes");

// Without prefix
const noPrefix = Hex.from("deadbeef");
console.log("\nNo prefix:", noPrefix.toString());
console.log("Size:", noPrefix.size(), "bytes");

// Size relationship: 2 hex chars = 1 byte
const testHex = Hex.from("0xaabbccdd");
const sizeInBytes = testHex.size();
const hexChars = testHex.toString().length - 2; // Remove '0x'
console.log("\nHex:", testHex.toString());
console.log("Hex chars (without 0x):", hexChars);
console.log("Size in bytes:", sizeInBytes);
console.log("Relationship: bytes = chars / 2:", sizeInBytes === hexChars / 2);
