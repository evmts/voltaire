import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Hash multiple chunks in sequence
const chunk1 = Hex.toBytes("0x0102");
const chunk2 = Hex.toBytes("0x0304");
const chunk3 = Hex.toBytes("0x0506");

// Hash all chunks together
const multiHash = Keccak256.hashMultiple([chunk1, chunk2, chunk3]);

// Equivalent to concatenating first, then hashing
const concatenated = new Uint8Array([...chunk1, ...chunk2, ...chunk3]);
const singleHash = Keccak256.hash(concatenated);

// Useful for merkle tree construction
const left = Keccak256.hash(new Uint8Array([0x01]));
const right = Keccak256.hash(new Uint8Array([0x02]));
const parent = Keccak256.hashMultiple([left, right]);
