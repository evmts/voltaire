import * as SHA256 from "../../../crypto/SHA256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Hash hex string data with SHA256
const hexData = "0xdeadbeef";
const hash = SHA256.hashHex(hexData);

console.log("Input hex:", hexData);
console.log("SHA256 hash:", Hex.fromBytes(hash));
console.log("Hash length:", hash.length, "bytes");

// Works without 0x prefix
const noPrefixHash = SHA256.hashHex("cafebabe");
console.log("\nWithout 0x prefix:");
console.log("Hash:", Hex.fromBytes(noPrefixHash));

// Hash longer hex strings
const longHex = "0x" + "a".repeat(128);
const longHash = SHA256.hashHex(longHex);
console.log("\nLong hex (64 bytes of 0xaa):");
console.log("Hash:", Hex.fromBytes(longHash));

// fromHex() alias
const aliasHash = SHA256.fromHex(hexData);
console.log(
	"\nfromHex() alias matches:",
	hash.every((b, i) => b === aliasHash[i]),
);
