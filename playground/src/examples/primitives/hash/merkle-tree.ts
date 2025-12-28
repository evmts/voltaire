import { Hash } from "voltaire";
// Example: Building Merkle trees for data verification

// Transaction hashes in a block
const tx1 = Hash.keccak256String("tx1: Alice -> Bob 1 ETH");
const tx2 = Hash.keccak256String("tx2: Bob -> Charlie 0.5 ETH");
const tx3 = Hash.keccak256String("tx3: Charlie -> Dave 2 ETH");
const tx4 = Hash.keccak256String("tx4: Dave -> Alice 0.25 ETH");

// Compute Merkle root
const merkleRoot = Hash.merkleRoot([tx1, tx2, tx3, tx4]);

// Single transaction (edge case)
const singleTx = Hash.merkleRoot([tx1]);

// Two transactions
const twoTxRoot = Hash.merkleRoot([tx1, tx2]);

// Empty array returns ZERO hash
const emptyRoot = Hash.merkleRoot([]);
