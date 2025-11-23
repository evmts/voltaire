import * as RIPEMD160 from "../../../crypto/RIPEMD160/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Hash string data with RIPEMD160
const message = "Hello, Bitcoin!";
const hash = RIPEMD160.hashString(message);
console.log("Original message:", message);
console.log("RIPEMD160 hash:", Hex.fromBytes(hash));
console.log("Hash length:", hash.length, "bytes (always 20)");

// Hash UTF-8 strings with unicode
const unicode = RIPEMD160.hashString("Hello 世界 🌍");
console.log("\nUnicode hash:", Hex.fromBytes(unicode));

// Empty string has known hash
const empty = RIPEMD160.hashString("");
console.log("\nEmpty string hash:", Hex.fromBytes(empty));

// Official test vectors
const abc = RIPEMD160.hashString("abc");
console.log("\n'abc' hash:", Hex.fromBytes(abc));
// Expected: 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
