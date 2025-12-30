import { Bytes, Hex, Ripemd160, SHA256 } from "@tevm/voltaire";

// RIPEMD160 - 160-bit hash used in Bitcoin addresses

// Hash a string
const message = "Hello, Bitcoin!";
const hash = Ripemd160.hashString(message);
console.log("String hash:", Hex.fromBytes(hash));

// Hash raw bytes
const bytes = Bytes([0x01, 0x02, 0x03, 0x04]);
const bytesHash = Ripemd160.hash(bytes);
console.log("Bytes hash:", Hex.fromBytes(bytesHash));

// Hash hex-encoded data
const hexData = "0xdeadbeef";
const hexHash = Ripemd160.hashHex(hexData);
console.log("Hex hash:", Hex.fromBytes(hexHash));

// Official test vectors
const empty = Ripemd160.hashString("");
console.log("Empty hash:", Hex.fromBytes(empty));
// Expected: 0x9c1185a5c5e9fc54612808977ee8f548b2258d31

const abc = Ripemd160.hashString("abc");
console.log("'abc' hash:", Hex.fromBytes(abc));
// Expected: 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc

// Bitcoin address derivation: RIPEMD160(SHA256(pubkey))
// This is called Hash160 in Bitcoin
const mockPubKey = Bytes(Array(33).fill(0x02)); // Compressed pubkey placeholder
const sha256Hash = SHA256.hash(mockPubKey);
const hash160 = Ripemd160.hash(sha256Hash);
console.log("Hash160:", Hex.fromBytes(hash160));
// This 20-byte hash becomes part of the Bitcoin address

// Unicode support
const unicode = Ripemd160.hashString("Hello 世界");
console.log("Unicode hash:", Hex.fromBytes(unicode));

// Longer test vector
const fox = Ripemd160.hashString("The quick brown fox jumps over the lazy dog");
console.log("Fox hash:", Hex.fromBytes(fox));
// Expected: 0x37f332f68db77bd9d7edd4969571ad671cf9dd3b

// Repeated data
const repeated = "a".repeat(1000);
const repeatedHash = Ripemd160.hashString(repeated);
console.log("Repeated 'a' hash:", Hex.fromBytes(repeatedHash));
