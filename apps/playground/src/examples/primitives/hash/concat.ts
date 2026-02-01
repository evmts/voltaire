import { Hash } from "@tevm/voltaire";
// Example: Concatenating and hashing multiple values

// Concatenate two hashes
const hash1 = Hash.keccak256String("data1");
const hash2 = Hash.keccak256String("data2");

const combined = Hash.concat(hash1, hash2);

// Concatenate multiple hashes
const hash3 = Hash.keccak256String("data3");
const hash4 = Hash.keccak256String("data4");
const multiCombined = Hash.concat(hash1, hash2, hash3, hash4);

// Common pattern: hash of concatenated hashes (Merkle tree node)
const node1 = Hash.keccak256String("leaf1");
const node2 = Hash.keccak256String("leaf2");
const parent = Hash.concat(node1, node2);

// Single hash (identity)
const single = Hash.concat(hash1);
