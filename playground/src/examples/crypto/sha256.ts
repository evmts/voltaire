import { Bytes, Hex, SHA256 } from "@tevm/voltaire";

// SHA256 - Standard cryptographic hash (Bitcoin, SSL/TLS)

// Hash a string (UTF-8 encoded)
const message = "Hello, World!";
const hash = SHA256.hashString(message);

// Hash raw bytes
const bytes = Bytes([0x01, 0x02, 0x03, 0x04]);
const bytesHash = SHA256.hashBytes(bytes);

// Hash hex-encoded data
const hexData = "0xdeadbeef";
const hexHash = SHA256.hashHex(hexData);

// Official test vectors
const empty = SHA256.hashString("");
// Expected: 0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

const abc = SHA256.hashString("abc");
// Expected: 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad

// Double SHA256 (used in Bitcoin)
const data = new TextEncoder().encode("Bitcoin transaction");
const firstHash = SHA256.hashBytes(data);
const doubleHash = SHA256.hashBytes(firstHash);

// HMAC-SHA256 for message authentication
const key = new TextEncoder().encode("secret key");
const hmacMessage = new TextEncoder().encode("message to authenticate");
const hmac = SHA256.hmac(key, hmacMessage);

// Merkle tree internal node (concat and hash)
const left = SHA256.hashString("leaf1");
const right = SHA256.hashString("leaf2");
const parent = SHA256.hashBytes(Bytes.concat(left, right));

// Unicode support
const unicode = SHA256.hashString("Hello 世界");
