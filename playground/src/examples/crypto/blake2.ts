import { Blake2, Bytes, Hex } from "@tevm/voltaire";

// Blake2b - Fast secure hash with variable output length

// Default 64-byte (512-bit) hash
const message = "Hello, Blake2!";
const hash64 = Blake2.hash(message, 64);

// 32-byte hash (SHA256-equivalent security)
const hash32 = Blake2.hash(message, 32);

// 20-byte hash (address-sized)
const hash20 = Blake2.hash(message, 20);

// Hash raw bytes
const bytes = Bytes([0x01, 0x02, 0x03, 0x04]);
const bytesHash = Blake2.hash(bytes, 32);

// Keyed hashing (MAC)
const key = new TextEncoder().encode("my secret key");
const data = new TextEncoder().encode("message to authenticate");
const mac = Blake2.hash(data, 32, key);

// Content addressing (unique identifier for data)
const fileContent = new TextEncoder().encode("file contents here...");
const contentId = Blake2.hash(fileContent, 32);

// Variable length outputs
const hash16 = Blake2.hash("test", 16);
const hash24 = Blake2.hash("test", 24);
const hash48 = Blake2.hash("test", 48);

// Test vectors
const empty = Blake2.hash("", 64);
const abc = Blake2.hash("abc", 64);

// Compare different lengths for same input
const short = Hex.fromBytes(Blake2.hash("Voltaire", 20));
const long = Hex.fromBytes(Blake2.hash("Voltaire", 64));
