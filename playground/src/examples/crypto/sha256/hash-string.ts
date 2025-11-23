import * as SHA256 from "../../../crypto/SHA256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Hash string data with SHA256
const message = "Hello, World!";
const hash = SHA256.hashString(message);
console.log("Original message:", message);
console.log("SHA256 hash:", Hex.fromBytes(hash));
console.log("Hash length:", hash.length, "bytes (always 32)");

// Hash UTF-8 strings with unicode
const unicode = SHA256.hashString("Hello 世界 🌍");
console.log("\nUnicode hash:", Hex.fromBytes(unicode));

// Empty string has known hash
const empty = SHA256.hashString("");
console.log("\nEmpty string hash:", Hex.fromBytes(empty));
// Expected: 0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

// Official test vectors
const abc = SHA256.hashString("abc");
console.log("\n'abc' hash:", Hex.fromBytes(abc));
// Expected: 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
