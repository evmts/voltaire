import { Proof, Hash } from "@tevm/voltaire";

// Proof: Merkle proofs for state verification
// Used for storage proofs, inclusion proofs, and cross-chain verification

// Create a proof from array of hashes
const proofHashes = [
	Hash("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"),
	Hash("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678"),
	Hash("0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"),
];

const proof = Proof.from(proofHashes);
console.log("Proof created with", proof.length, "nodes");

// Compare proofs
const proof2 = Proof.from(proofHashes);
console.log("Proofs equal:", Proof.equals(proof, proof2));

// Different proof
const differentProof = Proof.from([
	Hash("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
]);
console.log("Different proof equals:", Proof.equals(proof, differentProof));

// Example: Ethereum storage proof structure
// (as returned by eth_getProof)
const storageProof = {
	key: "0x0000000000000000000000000000000000000000000000000000000000000001",
	value: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
	proof: [
		"0xf90211a0...", // First node
		"0xf90211a0...", // Intermediate nodes
		"0xf8518080...", // Leaf node
	],
};

console.log("Storage proof structure:", {
	key: storageProof.key.slice(0, 20) + "...",
	value: storageProof.value,
	proofNodes: storageProof.proof.length,
});

// Example: Account proof (for proving account existence)
const accountProof = {
	address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	balance: "1000000000000000000",
	codeHash: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
	nonce: "5",
	storageHash: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	accountProof: [
		"0xf90211a0...",
		"0xf90211a0...",
		"0xf8679e...",
	],
};

console.log("Account proof for:", accountProof.address.slice(0, 20) + "...");
console.log("Balance:", accountProof.balance);
console.log("Nonce:", accountProof.nonce);
