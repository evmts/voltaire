import * as Blake2 from "../../../crypto/Blake2/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Hash string data with Blake2b (default 64-byte output)
const message = "Hello, Ethereum!";
const hash = Blake2.hashString(message);

console.log("Input:", message);
console.log("Hash (hex):", Hex.fromBytes(hash));
console.log("Hash length:", hash.length, "bytes (default 64)");
console.log("Hash type:", hash.constructor.name);

// Hash empty string
const emptyHash = Blake2.hashString("");
console.log("\nEmpty hash:", Hex.fromBytes(emptyHash));

// Hash with default constructor
const constructorHash = Blake2.hash("Hello, Ethereum!");
console.log(
	"\nHashes match:",
	Hex.fromBytes(hash) === Hex.fromBytes(constructorHash),
);
