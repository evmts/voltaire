import { Hex, Keccak256 } from "voltaire";
// Example: Hash UTF-8 strings
const message = "Hello Voltaire!";
const hash = Keccak256.hashString(message);

// Known test vector - "abc"
const abcHash = Keccak256.hashString("abc");

// Empty string produces known empty hash
const emptyHash = Keccak256.hashString("");
