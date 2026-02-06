import { Bytes, Hash } from "@tevm/voltaire";
// Example: Generating hashes using Keccak256

// Hash a string
const message = "Hello, Ethereum!";
const stringHash = Hash.keccak256String(message);

// Hash a hex string
const hexData = "0xdeadbeef";
const hexHash = Hash.keccak256Hex(hexData);

// Hash bytes directly
const bytes = Bytes([1, 2, 3, 4, 5]);
const bytesHash = Hash.keccak256(bytes);

// Empty string hash (common case)
const emptyHash = Hash.keccak256String("");

// Function signature hash (first 4 bytes used as selector)
const signature = "transfer(address,uint256)";
const sigHash = Hash.keccak256String(signature);
const selector = Hash.slice(sigHash, 0, 4);
