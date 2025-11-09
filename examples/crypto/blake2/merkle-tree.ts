import { Blake2 } from "../../../src/crypto/Blake2/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const data = [
	"Transaction 1: Alice sends 10 ETH to Bob",
	"Transaction 2: Bob sends 5 ETH to Carol",
	"Transaction 3: Carol sends 2 ETH to Dave",
	"Transaction 4: Dave sends 1 ETH to Alice",
];
data.forEach((tx, i) => {});

// Hash each leaf with Blake2 (32-byte output for standard security)
const leaves = data.map((tx) => {
	const txBytes = new TextEncoder().encode(tx);
	return Blake2.hash(txBytes, 32);
});
leaves.forEach((leaf, i) => {});

function buildMerkleTree(leafHashes: Uint8Array[]): Uint8Array[][] {
	const tree: Uint8Array[][] = [leafHashes];

	while (tree[tree.length - 1].length > 1) {
		const currentLevel = tree[tree.length - 1];
		const nextLevel: Uint8Array[] = [];

		for (let i = 0; i < currentLevel.length; i += 2) {
			const left = currentLevel[i];
			const right = currentLevel[i + 1] || left; // Duplicate if odd

			// Concatenate left + right and hash
			const combined = new Uint8Array([...left, ...right]);
			const parentHash = Blake2.hash(combined, 32);
			nextLevel.push(parentHash);
		}

		tree.push(nextLevel);
	}

	return tree;
}

const merkleTree = buildMerkleTree(leaves);
merkleTree.forEach((level, i) => {
	level.forEach((node, j) => {});
});

const merkleRoot = merkleTree[merkleTree.length - 1][0];

function generateMerkleProof(
	tree: Uint8Array[][],
	leafIndex: number,
): { index: number; hash: Uint8Array; isLeft: boolean }[] {
	const proof: { index: number; hash: Uint8Array; isLeft: boolean }[] = [];
	let currentIndex = leafIndex;

	for (let level = 0; level < tree.length - 1; level++) {
		const currentLevel = tree[level];
		const isLeft = currentIndex % 2 === 0;
		const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;

		if (siblingIndex < currentLevel.length) {
			proof.push({
				index: siblingIndex,
				hash: currentLevel[siblingIndex],
				isLeft: !isLeft,
			});
		}

		currentIndex = Math.floor(currentIndex / 2);
	}

	return proof;
}

const proofIndex = 1; // Prove Transaction 2
const proof = generateMerkleProof(merkleTree, proofIndex);
proof.forEach((step, i) => {});

function verifyMerkleProof(
	leafHash: Uint8Array,
	proof: { hash: Uint8Array; isLeft: boolean }[],
	root: Uint8Array,
): boolean {
	let currentHash = leafHash;

	proof.forEach((step, i) => {
		const combined = step.isLeft
			? new Uint8Array([...step.hash, ...currentHash])
			: new Uint8Array([...currentHash, ...step.hash]);

		currentHash = Blake2.hash(combined, 32);
	});

	return Hex.fromBytes(currentHash) === Hex.fromBytes(root);
}

const isValid = verifyMerkleProof(
	leaves[proofIndex],
	proof.map((p) => ({ hash: p.hash, isLeft: p.isLeft })),
	merkleRoot,
);

// Demonstrate with 16-byte hashes
const compactLeaves = data.map((tx) =>
	Blake2.hash(new TextEncoder().encode(tx), 16),
);

const largeDataset = Array.from(
	{ length: 1000 },
	(_, i) => `Transaction ${i + 1}: data_${i}`,
);

const start = performance.now();
const largeLeaves = largeDataset.map((tx) =>
	Blake2.hash(new TextEncoder().encode(tx), 32),
);
const largeTree = buildMerkleTree(largeLeaves);
const largeRoot = largeTree[largeTree.length - 1][0];
const elapsed = performance.now() - start;

// Modify Transaction 2
const updatedData = [...data];
updatedData[1] = "Transaction 2: Bob sends 7 ETH to Carol (UPDATED)";

// Only rehash the path from leaf to root
const newLeafHash = Blake2.hash(new TextEncoder().encode(updatedData[1]), 32);

// Rebuild tree with updated leaf
const updatedLeaves = [...leaves];
updatedLeaves[1] = newLeafHash;
const updatedTree = buildMerkleTree(updatedLeaves);
const updatedRoot = updatedTree[updatedTree.length - 1][0];
