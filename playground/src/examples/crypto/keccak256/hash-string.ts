import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Hash UTF-8 strings
const message = "Hello Voltaire!";
const hash = Keccak256.hashString(message);

console.log("Message:", message);
console.log("Hash:", Hex.fromBytes(hash));

// Known test vector - "abc"
const abcHash = Keccak256.hashString("abc");
console.log('Hash of "abc":', Hex.fromBytes(abcHash));
console.log(
	"Expected:",
	"0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
);

// Empty string produces known empty hash
const emptyHash = Keccak256.hashString("");
console.log("Empty string hash:", Hex.fromBytes(emptyHash));
