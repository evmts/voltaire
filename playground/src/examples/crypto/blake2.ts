import { Blake2, Bytes, Hex } from "@tevm/voltaire";

// Blake2b - Fast secure hash with variable output length

// Default 64-byte (512-bit) hash
const message = "Hello, Blake2!";
const hash64 = Blake2.hash(new TextEncoder().encode(message), 64);
console.log("64-byte hash:", Hex.fromBytes(hash64));

// 32-byte hash (SHA256-equivalent security)
const hash32 = Blake2.hash(new TextEncoder().encode(message), 32);
console.log("32-byte hash:", Hex.fromBytes(hash32));

// 20-byte hash (address-sized)
const hash20 = Blake2.hash(new TextEncoder().encode(message), 20);
console.log("20-byte hash:", Hex.fromBytes(hash20));

// Hash raw bytes
const bytes = Bytes([0x01, 0x02, 0x03, 0x04]);
const bytesHash = Blake2.hash(bytes, 32);
console.log("Bytes hash:", Hex.fromBytes(bytesHash));

// Keyed hashing (MAC)
const key = new TextEncoder().encode("my secret key");
const data = new TextEncoder().encode("message to authenticate");
const mac = Blake2.hash(data, 32, key);
console.log("Keyed MAC:", Hex.fromBytes(mac));

// Content addressing (unique identifier for data)
const fileContent = new TextEncoder().encode("file contents here...");
const contentId = Blake2.hash(fileContent, 32);
console.log("Content ID:", Hex.fromBytes(contentId));

// Variable length outputs
const hash16 = Blake2.hash(new TextEncoder().encode("test"), 16);
const hash24 = Blake2.hash(new TextEncoder().encode("test"), 24);
const hash48 = Blake2.hash(new TextEncoder().encode("test"), 48);
console.log("16-byte:", Hex.fromBytes(hash16));
console.log("24-byte:", Hex.fromBytes(hash24));
console.log("48-byte:", Hex.fromBytes(hash48));

// Test vectors
const empty = Blake2.hash(new TextEncoder().encode(""), 64);
const abc = Blake2.hash(new TextEncoder().encode("abc"), 64);
console.log("Empty hash:", Hex.fromBytes(empty));
console.log("'abc' hash:", Hex.fromBytes(abc));

// Compare different lengths for same input
const short = Hex.fromBytes(Blake2.hash(new TextEncoder().encode("Voltaire"), 20));
const long = Hex.fromBytes(Blake2.hash(new TextEncoder().encode("Voltaire"), 64));
console.log("Short (20):", short);
console.log("Long (64):", long);
