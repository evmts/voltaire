import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Hash raw bytes with Keccak256
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = Keccak256.hash(data);

console.log("Input data:", data);
console.log("Hash length:", hash.length, "bytes");
console.log("Hash (hex):", Hex.fromBytes(hash));

// Hash empty data - produces well-known empty keccak256 hash
const emptyHash = Keccak256.hash(new Uint8Array(0));
console.log("Empty hash:", Hex.fromBytes(emptyHash));
console.log(
	"Expected:",
	"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
);
