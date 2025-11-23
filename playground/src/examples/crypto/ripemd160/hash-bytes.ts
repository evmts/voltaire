import * as RIPEMD160 from "../../../crypto/RIPEMD160/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Hash raw byte arrays
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = RIPEMD160.hash(data);
console.log("Data bytes:", Array.from(data));
console.log("RIPEMD160 hash:", Hex.fromBytes(hash));
console.log("Hash length:", hash.length, "bytes");

// Hash accepts string or Uint8Array
const fromString = RIPEMD160.hash("test");
console.log("\nHash from string:", Hex.fromBytes(fromString));

// Large data
const largeData = new Uint8Array(1000).fill(0xaa);
const largeHash = RIPEMD160.hash(largeData);
console.log("\nLarge data hash:", Hex.fromBytes(largeHash));

// Binary data with all byte values
const allBytes = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
	allBytes[i] = i;
}
const allBytesHash = RIPEMD160.hash(allBytes);
console.log("\nAll bytes 0-255 hash:", Hex.fromBytes(allBytesHash));
