import { RIPEMD160 } from "voltaire";
import { Hex } from "voltaire";

// Hash string data with RIPEMD160
const message = "Hello, Bitcoin!";
const hash = RIPEMD160.hashString(message);

// Hash UTF-8 strings with unicode
const unicode = RIPEMD160.hashString("Hello 世界 🌍");

// Empty string has known hash
const empty = RIPEMD160.hashString("");

// Official test vectors
const abc = RIPEMD160.hashString("abc");
// Expected: 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
