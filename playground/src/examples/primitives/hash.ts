import { Hash, Bytes32, Hex } from "@tevm/voltaire";

// === Hash Creation ===
// From hex string (32 bytes)
const hash1 = Hash(
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
);
console.log("Hash from hex:", hash1.toHex());

// From bytes
const hash2 = Hash.fromBytes(
  Bytes32.from([
    0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
    0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
    0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
    0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef
  ])
);
console.log("Hash from bytes:", hash2.toHex());

// Random hash (useful for testing)
const randomHash = Hash.random();
console.log("Random hash:", randomHash.toHex());

// Zero hash
const zeroHash = Hash.zero();
console.log("Zero hash:", zeroHash.toHex());

// === Keccak256 Hashing ===
// Hash bytes
const data = new TextEncoder().encode("Hello, Ethereum!");
const dataHash = Hash.keccak256(data);
console.log("Keccak256 of 'Hello, Ethereum!':", dataHash.toHex());

// Hash hex string
const hexData = Hex("0x48656c6c6f"); // "Hello"
const hexHash = Hash.keccak256(hexData.toBytes());
console.log("Keccak256 of hex data:", hexHash.toHex());

// === Hash Comparison ===
console.log("Equals:", hash1.equals(hash2));
console.log("Is zero:", zeroHash.isZero());

// === Hash Operations ===
// Clone
const cloned = hash1.clone();
console.log("Cloned:", cloned.toHex());

// Slice (get portion of hash)
const first16 = hash1.slice(0, 16);
console.log("First 16 bytes:", first16.toHex());

// Concatenate hashes (for Merkle trees)
const combined = Hash.concat(hash1, hash2);
console.log("Concatenated length:", combined.length, "bytes");

// === Common Use Cases ===
// Function selector (first 4 bytes of keccak256)
const signature = "transfer(address,uint256)";
const sigBytes = new TextEncoder().encode(signature);
const sigHash = Hash.keccak256(sigBytes);
const selector = sigHash.slice(0, 4);
console.log("Function selector:", selector.toHex());

// Event topic
const eventSig = "Transfer(address,address,uint256)";
const eventBytes = new TextEncoder().encode(eventSig);
const eventTopic = Hash.keccak256(eventBytes);
console.log("Event topic:", eventTopic.toHex());
