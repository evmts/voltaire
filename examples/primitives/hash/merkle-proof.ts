/**
 * Merkle Proof Example
 *
 * Demonstrates:
 * - Building Merkle trees from hash leaves
 * - Computing Merkle roots
 * - Generating Merkle proofs
 * - Verifying Merkle proofs
 * - Real-world use cases (airdrop eligibility, transaction inclusion)
 */

import { Hash } from "../../../src/primitives/Hash/index.js";

// Hash pair of nodes together
function hashPair(left: Hash, right: Hash): Hash {
	// Concatenate and hash (left || right)
	const combined = new Uint8Array(64);
	combined.set(left, 0);
	combined.set(right, 32);
	return Hash.keccak256(combined);
}

// Simple example with 4 leaves
const leaf1 = Hash.keccak256String("Alice: 100 tokens");
const leaf2 = Hash.keccak256String("Bob: 200 tokens");
const leaf3 = Hash.keccak256String("Charlie: 150 tokens");
const leaf4 = Hash.keccak256String("Dave: 75 tokens");

// Level 1: Hash pairs
const node12 = hashPair(leaf1, leaf2);
const node34 = hashPair(leaf3, leaf4);

// Root: Hash the two level 1 nodes
const root = hashPair(node12, node34);

class MerkleTree {
	private leaves: Hash[];
	private layers: Hash[][];

	constructor(leaves: Hash[]) {
		if (leaves.length === 0) {
			throw new Error("Cannot create tree from empty leaves");
		}
		this.leaves = [...leaves];
		this.layers = this.buildTree(leaves);
	}

	private buildTree(leaves: Hash[]): Hash[][] {
		const layers: Hash[][] = [leaves];
		let currentLevel = leaves;

		while (currentLevel.length > 1) {
			const nextLevel: Hash[] = [];

			for (let i = 0; i < currentLevel.length; i += 2) {
				if (i + 1 < currentLevel.length) {
					// Hash pair
					nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
				} else {
					// Odd number - promote last node
					nextLevel.push(currentLevel[i]);
				}
			}

			layers.push(nextLevel);
			currentLevel = nextLevel;
		}

		return layers;
	}

	getRoot(): Hash {
		return this.layers[this.layers.length - 1][0];
	}

	getProof(leafIndex: number): Hash[] {
		if (leafIndex < 0 || leafIndex >= this.leaves.length) {
			throw new Error("Invalid leaf index");
		}

		const proof: Hash[] = [];
		let index = leafIndex;

		// Go up the tree, collecting sibling hashes
		for (let level = 0; level < this.layers.length - 1; level++) {
			const currentLayer = this.layers[level];
			const isLeftNode = index % 2 === 0;
			const siblingIndex = isLeftNode ? index + 1 : index - 1;

			if (siblingIndex < currentLayer.length) {
				proof.push(currentLayer[siblingIndex]);
			}

			index = Math.floor(index / 2);
		}

		return proof;
	}

	getDepth(): number {
		return this.layers.length - 1;
	}

	getLeaves(): Hash[] {
		return [...this.leaves];
	}
}

// Build tree
const leaves = [leaf1, leaf2, leaf3, leaf4];
const tree = new MerkleTree(leaves);

// Generate proof for Alice (index 0)
const aliceProof = tree.getProof(0);
aliceProof.forEach((hash, i) => {});

// Generate proof for Charlie (index 2)
const charlieProof = tree.getProof(2);
charlieProof.forEach((hash, i) => {});

function verifyProof(
	leaf: Hash,
	proof: Hash[],
	root: Hash,
	leafIndex: number,
): boolean {
	let computedHash = leaf;
	let index = leafIndex;

	for (const proofElement of proof) {
		// Determine if current node is left or right
		const isLeftNode = index % 2 === 0;

		if (isLeftNode) {
			// Current is left, proof element is right
			computedHash = hashPair(computedHash, proofElement);
		} else {
			// Current is right, proof element is left
			computedHash = hashPair(proofElement, computedHash);
		}

		index = Math.floor(index / 2);
	}

	return computedHash.equals(root);
}

// Verify Alice's proof
const aliceValid = verifyProof(leaf1, aliceProof, tree.getRoot(), 0);

// Verify Charlie's proof
const charlieValid = verifyProof(leaf3, charlieProof, tree.getRoot(), 2);

// Try invalid proof (wrong leaf)
const invalidProof = verifyProof(leaf1, charlieProof, tree.getRoot(), 2);

interface AirdropEntry {
	address: string;
	amount: bigint;
}

function createAirdropLeaf(entry: AirdropEntry): Hash {
	// Hash address + amount together (simplified)
	const data = `${entry.address}:${entry.amount}`;
	return Hash.keccak256String(data);
}

const airdropList: AirdropEntry[] = [
	{ address: "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e", amount: 1000n },
	{ address: "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", amount: 2000n },
	{ address: "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2", amount: 1500n },
	{ address: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db", amount: 750n },
];

// Create leaves from airdrop entries
const airdropLeaves = airdropList.map(createAirdropLeaf);
const airdropTree = new MerkleTree(airdropLeaves);

// User claims their airdrop
function claimAirdrop(address: string, amount: bigint, proof: Hash[]): boolean {
	const entry: AirdropEntry = { address, amount };
	const leaf = createAirdropLeaf(entry);

	// Find index in original list (in production, user would provide this)
	const index = airdropList.findIndex(
		(e) => e.address === address && e.amount === amount,
	);

	if (index === -1) return false;

	return verifyProof(leaf, proof, airdropTree.getRoot(), index);
}

// User 0 claims their airdrop
const user0Address = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
const user0Amount = 1000n;
const user0Proof = airdropTree.getProof(0);

const claimValid = claimAirdrop(user0Address, user0Amount, user0Proof);

// Try invalid claim (wrong amount)
const invalidClaim = claimAirdrop(user0Address, 9999n, user0Proof);

// Simulate block with transactions
const txHashes = [
	Hash.keccak256String("tx1: Alice sends 1 ETH to Bob"),
	Hash.keccak256String("tx2: Bob sends 2 ETH to Charlie"),
	Hash.keccak256String("tx3: Charlie sends 0.5 ETH to Dave"),
	Hash.keccak256String("tx4: Dave sends 0.1 ETH to Alice"),
	Hash.keccak256String("tx5: Alice approves token"),
	Hash.keccak256String("tx6: Bob swaps tokens"),
	Hash.keccak256String("tx7: Charlie stakes tokens"),
	Hash.keccak256String("tx8: Dave claims rewards"),
];

const txTree = new MerkleTree(txHashes);
const txRoot = txTree.getRoot();

// Prove transaction 2 is in the block
const tx2Index = 2;
const tx2Proof = txTree.getProof(tx2Index);

function demonstrateProofSize(numLeaves: number) {
	// Create dummy leaves
	const dummyLeaves = Array.from({ length: numLeaves }, (_, i) =>
		Hash.keccak256String(`leaf ${i}`),
	);

	const dummyTree = new MerkleTree(dummyLeaves);
	const proof = dummyTree.getProof(0);

	const proofSize = proof.length * 32; // Each hash is 32 bytes
	const treeDepth = dummyTree.getDepth();
}
demonstrateProofSize(4);
demonstrateProofSize(8);
demonstrateProofSize(16);
demonstrateProofSize(32);
demonstrateProofSize(64);
demonstrateProofSize(128);
demonstrateProofSize(256);
demonstrateProofSize(1024);
demonstrateProofSize(10000);

const initialLeaves = [
	Hash.keccak256String("data1"),
	Hash.keccak256String("data2"),
	Hash.keccak256String("data3"),
	Hash.keccak256String("data4"),
];

const tree1 = new MerkleTree(initialLeaves);

// Add new leaves
const newLeaves = [
	...initialLeaves,
	Hash.keccak256String("data5"),
	Hash.keccak256String("data6"),
];

const tree2 = new MerkleTree(newLeaves);
