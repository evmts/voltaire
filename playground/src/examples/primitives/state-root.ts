import { Hash } from "@tevm/voltaire";

// StateRoot: Merkle Patricia Trie root hash
// Represents the entire state of the blockchain at a block

// State root from a block header
const stateRoot = Hash(
	"0x7c5a35e9cb3e8ae0e221ab470abae9d446c85aa4b0c3ae2c5c7a41e9e51a3f7e",
);
console.log("State root:", stateRoot);

// State roots change with every state modification
const genesisStateRoot = Hash(
	"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544",
);
console.log("Genesis state root:", genesisStateRoot);

// State root is used for:
// 1. Block validation
// 2. Light client sync
// 3. State proofs
// 4. Cross-chain bridges

// Example: Verify state transition
const parentStateRoot = Hash(
	"0xabc0000000000000000000000000000000000000000000000000000000000001",
);
const childStateRoot = Hash(
	"0xdef0000000000000000000000000000000000000000000000000000000000002",
);

console.log("\nState transition:");
console.log("  Parent:", Hash.toHex(parentStateRoot).slice(0, 20) + "...");
console.log("  Child:", Hash.toHex(childStateRoot).slice(0, 20) + "...");
console.log("  Changed:", !Hash.equals(parentStateRoot, childStateRoot));

// Empty state root (no accounts)
const emptyStateRoot = Hash(
	"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
);
console.log("\nEmpty trie root:", Hash.toHex(emptyStateRoot).slice(0, 20) + "...");

// State components that affect the root:
// - Account balances
// - Account nonces
// - Contract code
// - Contract storage

const stateComponents = {
	accounts: "Modified when balance or nonce changes",
	code: "Set once at contract creation",
	storage: "Modified by SSTORE opcode",
};

console.log("\nState root depends on:");
Object.entries(stateComponents).forEach(([key, desc]) => {
	console.log(`  ${key}: ${desc}`);
});

// Historical state roots (example)
const historicalRoots = [
	{ block: 0, root: "0xd7f8974f..." },
	{ block: 1000000, root: "0x5c8e5b54..." },
	{ block: 10000000, root: "0x2b7e5c32..." },
];

console.log("\nHistorical state roots:");
historicalRoots.forEach(({ block, root }) => {
	console.log(`  Block ${block.toLocaleString()}: ${root}`);
});
