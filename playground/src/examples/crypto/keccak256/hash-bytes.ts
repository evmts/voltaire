import { Hex, Keccak256 } from "voltaire";
// Example: Hash raw bytes with Keccak256
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = Keccak256.hash(data);

// Hash empty data - produces well-known empty keccak256 hash
const emptyHash = Keccak256.hash(new Uint8Array(0));
