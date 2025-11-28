// SHA256: Hash string data
import * as SHA256 from "../../../../src/crypto/SHA256/index.js";
import * as Hex from "../../../../src/primitives/Hex/index.js";

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

// Official test vectors
const abc = SHA256.hashString("abc");
console.log('\n"abc" hash:', Hex.fromBytes(abc));
