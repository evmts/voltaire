import { Bytes32, Hash, Hex } from "@tevm/voltaire";

// === Hash Creation ===
// From hex string (32 bytes)
const hash1 = Hash(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

// From bytes
const hash2 = Hash.fromBytes(
	Bytes32.from([
		0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78,
		0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
		0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
	]),
);

// Random hash (useful for testing)
const randomHash = Hash.random();

// Zero hash
const zeroHash = Hash.zero();

// === Keccak256 Hashing ===
// Hash bytes
const data = new TextEncoder().encode("Hello, Ethereum!");
const dataHash = Hash.keccak256(data);

// Hash hex string
const hexData = Hex("0x48656c6c6f"); // "Hello"
const hexHash = Hash.keccak256(hexData.toBytes());

// === Hash Operations ===
// Clone
const cloned = hash1.clone();

// Slice (get portion of hash)
const first16 = hash1.slice(0, 16);

// Concatenate hashes (for Merkle trees)
const combined = Hash.concat(hash1, hash2);

// === Common Use Cases ===
// Function selector (first 4 bytes of keccak256)
const signature = "transfer(address,uint256)";
const sigBytes = new TextEncoder().encode(signature);
const sigHash = Hash.keccak256(sigBytes);
const selector = sigHash.slice(0, 4);

// Event topic
const eventSig = "Transfer(address,address,uint256)";
const eventBytes = new TextEncoder().encode(eventSig);
const eventTopic = Hash.keccak256(eventBytes);
