// SHA256: Hash string data
import * as SHA256 from "../../../../src/crypto/SHA256/index.js";
import * as Hex from "../../../../src/primitives/Hex/index.js";

const message = "Hello, World!";
const hash = SHA256.hashString(message);

// Hash UTF-8 strings with unicode
const unicode = SHA256.hashString("Hello 世界 🌍");

// Empty string has known hash
const empty = SHA256.hashString("");

// Official test vectors
const abc = SHA256.hashString("abc");
