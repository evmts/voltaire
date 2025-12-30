import { Bytes, Hex, SHA256 } from "@tevm/voltaire";

// SHA256 - Standard cryptographic hash (Bitcoin, SSL/TLS)

// Hash a string (UTF-8 encoded)
const message = "Hello, World!";
const hash = SHA256.hashString(message);
console.log("String hash:", Hex.fromBytes(hash));

// Hash raw bytes
const bytes = Bytes([0x01, 0x02, 0x03, 0x04]);
const bytesHash = SHA256.hash(bytes);
console.log("Bytes hash:", Hex.fromBytes(bytesHash));

// Hash hex-encoded data
const hexData = "0xdeadbeef";
const hexHash = SHA256.hashHex(hexData);
console.log("Hex hash:", Hex.fromBytes(hexHash));

// Official test vectors
const empty = SHA256.hashString("");
console.log("Empty string hash:", Hex.fromBytes(empty));
// Expected: 0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

const abc = SHA256.hashString("abc");
console.log("'abc' hash:", Hex.fromBytes(abc));
// Expected: 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad

// Double SHA256 (used in Bitcoin)
const data = new TextEncoder().encode("Bitcoin transaction");
const firstHash = SHA256.hash(data);
const doubleHash = SHA256.hash(firstHash);
console.log("Double SHA256:", Hex.fromBytes(doubleHash));

// Merkle tree internal node (concat and hash)
const left = SHA256.hashString("leaf1");
const right = SHA256.hashString("leaf2");
const parent = SHA256.hash(Bytes.concat(left, right));
console.log("Merkle parent:", Hex.fromBytes(parent));

// Unicode support
const unicode = SHA256.hashString("Hello 世界");
console.log("Unicode hash:", Hex.fromBytes(unicode));
