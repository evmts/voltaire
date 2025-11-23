import * as SHA256 from "../../../crypto/SHA256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// SHA256 supports multiple constructor patterns

console.log("SHA256 Constructor Patterns:\n");

// 1. from() - Universal constructor (accepts Uint8Array, hex, or string)
const fromBytes = SHA256.from(new Uint8Array([1, 2, 3]));
console.log("from(Uint8Array):", Hex.fromBytes(fromBytes));

// 2. fromString() - Type-safe string constructor
const fromString = SHA256.fromString("Hello, World!");
console.log("fromString():", Hex.fromBytes(fromString));

// 3. fromHex() - Type-safe hex constructor
const fromHex = SHA256.fromHex("0xdeadbeef");
console.log("fromHex():", Hex.fromBytes(fromHex));

// Legacy API (still supported)
console.log("\nLegacy API:");

// hash() - Hash raw bytes
const hashBytes = SHA256.hash(new Uint8Array([1, 2, 3]));
console.log("hash():", Hex.fromBytes(hashBytes));

// hashString() - Hash UTF-8 string
const hashStr = SHA256.hashString("Hello, World!");
console.log("hashString():", Hex.fromBytes(hashStr));

// hashHex() - Hash hex string
const hashHex = SHA256.hashHex("0xdeadbeef");
console.log("hashHex():", Hex.fromBytes(hashHex));

// Verify equivalence
console.log("\nAPI equivalence:");
console.log(
	"from() === hash():",
	fromBytes.every((b, i) => b === hashBytes[i]),
);
console.log(
	"fromString() === hashString():",
	fromString.every((b, i) => b === hashStr[i]),
);
console.log(
	"fromHex() === hashHex():",
	fromHex.every((b, i) => b === hashHex[i]),
);

// Constants
console.log("\nConstants:");
console.log("OUTPUT_SIZE:", SHA256.OUTPUT_SIZE, "bytes");
console.log("BLOCK_SIZE:", SHA256.BLOCK_SIZE, "bytes");
