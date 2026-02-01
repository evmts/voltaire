import { Hex, Keccak256 } from "@tevm/voltaire";
// Example: Build simple merkle tree using Keccak256
const data = ["alice", "bob", "charlie", "dave"];

// Hash each leaf
const leaves = data.map((item) => {
	const hash = Keccak256.hashString(item);
	return hash;
});

// Build tree layer by layer
function buildMerkleTree(leaves: Uint8Array[]): Uint8Array {
	if (leaves.length === 1) {
		return leaves[0];
	}

	const parents: Uint8Array[] = [];
	for (let i = 0; i < leaves.length; i += 2) {
		if (i + 1 < leaves.length) {
			// Hash pair
			const parent = Keccak256.hashMultiple([leaves[i], leaves[i + 1]]);
			parents.push(parent);
		} else {
			// Odd number - promote last node
			parents.push(leaves[i]);
		}
	}

	return buildMerkleTree(parents);
}
const root = buildMerkleTree(leaves);

// Verify merkle proof for "alice"
const aliceHash = leaves[0];
const bobHash = leaves[1];
const charlieHash = leaves[2];
const daveHash = leaves[3];

const aliceBobParent = Keccak256.hashMultiple([aliceHash, bobHash]);
const charlieDaveParent = Keccak256.hashMultiple([charlieHash, daveHash]);
const computedRoot = Keccak256.hashMultiple([
	aliceBobParent,
	charlieDaveParent,
]);
