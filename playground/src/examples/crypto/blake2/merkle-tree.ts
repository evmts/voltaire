import { Blake2, Bytes, Hex } from "@tevm/voltaire";
// Build Merkle tree using Blake2b for fast hashing

function merkleRoot(leaves: Uint8Array[], outputSize = 32): Uint8Array {
	if (leaves.length === 0) throw new Error("No leaves");
	if (leaves.length === 1) return Blake2.hash(leaves[0], outputSize);

	// Hash all leaves
	const hashes = leaves.map((leaf) => Blake2.hash(leaf, outputSize));

	// Build tree bottom-up
	while (hashes.length > 1) {
		const nextLevel: Uint8Array[] = [];

		for (let i = 0; i < hashes.length; i += 2) {
			const left = hashes[i];
			const right = hashes[i + 1] || left; // Duplicate last if odd

			// Concatenate and hash
			const combined = Bytes.concat(left, right);
			nextLevel.push(Blake2.hash(combined, outputSize));
		}

		hashes.length = 0;
		hashes.push(...nextLevel);
	}

	return hashes[0];
}

// Example: Build Merkle tree from transactions
const tx1 = new TextEncoder().encode("Alice sends 10 ETH to Bob");
const tx2 = new TextEncoder().encode("Bob sends 5 ETH to Charlie");
const tx3 = new TextEncoder().encode("Charlie sends 2 ETH to Dave");
const tx4 = new TextEncoder().encode("Dave sends 1 ETH to Eve");

const leaves = [tx1, tx2, tx3, tx4];

const root = merkleRoot(leaves, 32);

// Different output sizes
const root20 = merkleRoot(leaves, 20);

const root64 = merkleRoot(leaves, 64);

// Adding a leaf changes the root
const txExtra = new TextEncoder().encode("Eve sends 0.5 ETH to Frank");
const leavesWithExtra = [...leaves, txExtra];
const newRoot = merkleRoot(leavesWithExtra, 32);
