import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Hash hex-encoded data
const hexData = "0xdeadbeef";
const hash = Keccak256.hashHex(hexData);

console.log("Hex input:", hexData);
console.log("Hash:", Hex.fromBytes(hash));

// Hash longer hex string
const longHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const longHash = Keccak256.hashHex(longHex);
console.log("Long hex input:", longHex);
console.log("Hash:", Hex.fromBytes(longHash));

// Hex without 0x prefix also works
const unprefixed = "cafebabe";
const unprefixedHash = Keccak256.hashHex(unprefixed);
console.log("Unprefixed hex:", unprefixed);
console.log("Hash:", Hex.fromBytes(unprefixedHash));
