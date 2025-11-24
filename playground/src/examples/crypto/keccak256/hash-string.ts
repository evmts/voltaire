import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Hash UTF-8 strings
const message = "Hello Voltaire!";
const hash = Keccak256.hashString(message);

// Known test vector - "abc"
const abcHash = Keccak256.hashString("abc");

// Empty string produces known empty hash
const emptyHash = Keccak256.hashString("");
