import { Hex, SHA256 } from "@tevm/voltaire";
// Hash string data with SHA256
const message = "Hello, World!";
const hash = SHA256.hashString(message);

// Hash UTF-8 strings with unicode
const unicode = SHA256.hashString("Hello 世界 🌍");

// Empty string has known hash
const empty = SHA256.hashString("");
// Expected: 0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

// Official test vectors
const abc = SHA256.hashString("abc");
// Expected: 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
