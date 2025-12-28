// SHA256: Hash string data
import { Hex, SHA256 } from "@tevm/voltaire";

const message = "Hello, World!";
const hash = SHA256.hashString(message);

// Hash UTF-8 strings with unicode
const unicode = SHA256.hashString("Hello 世界 🌍");

// Empty string has known hash
const empty = SHA256.hashString("");

// Official test vectors
const abc = SHA256.hashString("abc");
