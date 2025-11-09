import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

/**
 * Cryptographic Commitment Schemes
 *
 * Demonstrates using Keccak256 for commitments:
 * - Commit-reveal schemes
 * - Secret commitments with nonces
 * - Timestamped commitments
 * - Merkle proofs
 * - Verifiable random functions
 */

console.log("=== Cryptographic Commitment Schemes ===\n");

// 1. Basic Commit-Reveal
console.log("1. Basic Commit-Reveal Scheme");
console.log("-".repeat(40));
console.log("Commit to a value without revealing it\n");

// Alice commits to her choice
const aliceChoice = "rock";
const aliceNonce = crypto.getRandomValues(new Uint8Array(32));

const commitment = Keccak256.hashMultiple([
	new TextEncoder().encode(aliceChoice),
	aliceNonce,
]);

console.log("Commit Phase:");
console.log(`Alice's choice: "${aliceChoice}" (kept secret)`);
console.log(`Nonce:          ${Hex.fromBytes(aliceNonce)}`);
console.log(`Commitment:     ${Hex.fromBytes(commitment)}\n`);

// Bob makes his choice (cannot change after seeing commitment)
const bobChoice = "paper";
console.log("Bob sees commitment and makes his choice:");
console.log(`Bob's choice: "${bobChoice}"\n`);

// Reveal Phase
console.log("Reveal Phase:");
const revealed = Keccak256.hashMultiple([
	new TextEncoder().encode(aliceChoice),
	aliceNonce,
]);

const verified = Hex.fromBytes(commitment) === Hex.fromBytes(revealed);
console.log(`Alice reveals: "${aliceChoice}"`);
console.log(`Commitment matches: ${verified}`);
console.log(
	`Winner: ${bobChoice === "paper" && aliceChoice === "rock" ? "Bob" : "Alice"}\n`,
);

// 2. Blind Auction
console.log("2. Blind Auction");
console.log("-".repeat(40));
console.log("Bidders commit to sealed bids, reveal later\n");

interface Bid {
	bidder: string;
	amount: number;
	nonce: Uint8Array;
	commitment: Uint8Array;
}

const bids: Bid[] = [];

// Commit phase
const bidders = [
	{ name: "Alice", amount: 100 },
	{ name: "Bob", amount: 150 },
	{ name: "Carol", amount: 125 },
];

console.log("Commit Phase:");
for (const { name, amount } of bidders) {
	const nonce = crypto.getRandomValues(new Uint8Array(32));
	const amountBytes = new Uint8Array(8);
	new DataView(amountBytes.buffer).setBigUint64(0, BigInt(amount), false);

	const commitment = Keccak256.hashMultiple([
		new TextEncoder().encode(name),
		amountBytes,
		nonce,
	]);

	bids.push({ bidder: name, amount, nonce, commitment });
	console.log(`  ${name}: ${Hex.fromBytes(commitment).slice(0, 20)}...`);
}

console.log("\nReveal Phase:");
let highestBid = 0;
let winner = "";

for (const bid of bids) {
	const amountBytes = new Uint8Array(8);
	new DataView(amountBytes.buffer).setBigUint64(0, BigInt(bid.amount), false);

	const revealed = Keccak256.hashMultiple([
		new TextEncoder().encode(bid.bidder),
		amountBytes,
		bid.nonce,
	]);

	const valid = Hex.fromBytes(bid.commitment) === Hex.fromBytes(revealed);
	console.log(`  ${bid.bidder}: $${bid.amount} (verified: ${valid})`);

	if (valid && bid.amount > highestBid) {
		highestBid = bid.amount;
		winner = bid.bidder;
	}
}

console.log(`\nWinner: ${winner} with bid of $${highestBid}\n`);

// 3. Timestamped Document Commitment
console.log("3. Timestamped Document Commitment");
console.log("-".repeat(40));
console.log("Prove document existed at specific time\n");

const document = "Important legal document content";
const timestamp = Date.now();
const documentHash = Keccak256.hashString(document);

// Create timestamped commitment
const timestampBytes = new Uint8Array(8);
new DataView(timestampBytes.buffer).setBigUint64(0, BigInt(timestamp), false);
const timestampedCommitment = Keccak256.hashMultiple([
	documentHash,
	timestampBytes,
]);

console.log(`Document: "${document.slice(0, 30)}..."`);
console.log(`Timestamp: ${new Date(timestamp).toISOString()}`);
console.log(`Document hash: ${Hex.fromBytes(documentHash)}`);
console.log(`Timestamped commitment: ${Hex.fromBytes(timestampedCommitment)}`);

// Later verification
console.log("\nVerification (later):");
const verifyHash = Keccak256.hashString(document);
const verifyCommitment = Keccak256.hashMultiple([verifyHash, timestampBytes]);

console.log(
	`Document matches: ${Hex.fromBytes(verifyHash) === Hex.fromBytes(documentHash)}`,
);
console.log(
	`Commitment matches: ${Hex.fromBytes(verifyCommitment) === Hex.fromBytes(timestampedCommitment)}\n`,
);

// 4. Merkle Proof
console.log("4. Merkle Proof");
console.log("-".repeat(40));
console.log("Prove inclusion in a set without revealing all items\n");

// Build Merkle tree
const leaves = [
	Keccak256.hashString("Transaction 1"),
	Keccak256.hashString("Transaction 2"),
	Keccak256.hashString("Transaction 3"),
	Keccak256.hashString("Transaction 4"),
];

console.log("Merkle tree leaves:");
for (let i = 0; i < leaves.length; i++) {
	console.log(`  Tx ${i + 1}: ${Hex.fromBytes(leaves[i]).slice(0, 20)}...`);
}

// Build tree
const level1 = [
	Keccak256.hashMultiple([leaves[0], leaves[1]]),
	Keccak256.hashMultiple([leaves[2], leaves[3]]),
];

const root = Keccak256.hashMultiple([level1[0], level1[1]]);
console.log(`\nMerkle root: ${Hex.fromBytes(root)}`);

// Prove Transaction 2 is included
const proofIndex = 1; // Transaction 2
const proof = [
	leaves[0], // Sibling
	level1[1], // Uncle
];

console.log("\nProof for Transaction 2:");
console.log(`  Leaf:    ${Hex.fromBytes(leaves[proofIndex]).slice(0, 20)}...`);
console.log(`  Sibling: ${Hex.fromBytes(proof[0]).slice(0, 20)}...`);
console.log(`  Uncle:   ${Hex.fromBytes(proof[1]).slice(0, 20)}...`);

// Verify proof
const step1 = Keccak256.hashMultiple([proof[0], leaves[proofIndex]]);
const computedRoot = Keccak256.hashMultiple([step1, proof[1]]);

console.log(`\nComputed root: ${Hex.fromBytes(computedRoot)}`);
console.log(
	`Proof valid: ${Hex.fromBytes(computedRoot) === Hex.fromBytes(root)}\n`,
);

// 5. Verifiable Random Function (simplified)
console.log("5. Verifiable Random Function");
console.log("-".repeat(40));
console.log("Generate randomness with proof of correct computation\n");

// Seed-based randomness
const seed = crypto.getRandomValues(new Uint8Array(32));
const input = new TextEncoder().encode("block-123");

console.log(`Seed:  ${Hex.fromBytes(seed)}`);
console.log(`Input: "block-123"`);

// Generate "random" output
const output = Keccak256.hashMultiple([seed, input]);
console.log(`Output: ${Hex.fromBytes(output)}\n`);

// Anyone can verify with same inputs
const verifyOutput = Keccak256.hashMultiple([seed, input]);
console.log("Verification:");
console.log(`  Recomputed: ${Hex.fromBytes(verifyOutput)}`);
console.log(
	`  Matches:    ${Hex.fromBytes(output) === Hex.fromBytes(verifyOutput)}\n`,
);

// 6. Hash Chain / One-Time Passwords
console.log("6. Hash Chain for One-Time Passwords");
console.log("-".repeat(40));

const chainLength = 5;
const initialSecret = crypto.getRandomValues(new Uint8Array(32));

// Build chain backwards
const chain: Uint8Array[] = [initialSecret];
for (let i = 1; i < chainLength; i++) {
	const next = Keccak256.hash(chain[chain.length - 1]);
	chain.push(next);
}

console.log("Hash chain (built backwards):");
for (let i = 0; i < chain.length; i++) {
	console.log(`  Link ${i}: ${Hex.fromBytes(chain[i]).slice(0, 20)}...`);
}

// Publish only the final hash
const publicCommitment = chain[chain.length - 1];
console.log(`\nPublic commitment: ${Hex.fromBytes(publicCommitment)}`);

// Use chain forwards (reveal one at a time)
console.log("\nUsing passwords (forward):");
for (let i = chain.length - 2; i >= 0; i--) {
	const password = chain[i];
	const hashed = Keccak256.hash(password);

	// Verify against previous commitment
	const expectedCommitment = chain[i + 1];
	const valid = Hex.fromBytes(hashed) === Hex.fromBytes(expectedCommitment);

	console.log(
		`  Password ${chain.length - 1 - i}: ${Hex.fromBytes(password).slice(0, 12)}... (valid: ${valid})`,
	);
}

console.log("\nEach password can only be used once");
console.log("Previous passwords cannot be derived from later ones\n");

// 7. Zero-Knowledge Proof (simplified)
console.log("7. Simple Zero-Knowledge Proof");
console.log("-".repeat(40));
console.log("Prove knowledge of secret without revealing it\n");

const secret = "my-secret-password";
const secretHash = Keccak256.hashString(secret);

console.log("Prover commits to secret hash:");
console.log(`  Secret hash: ${Hex.fromBytes(secretHash)}\n`);

// Challenge-response
const challenge = crypto.getRandomValues(new Uint8Array(32));
console.log("Verifier sends challenge:");
console.log(`  Challenge: ${Hex.fromBytes(challenge)}\n`);

// Prover responds with hash(secret || challenge)
const response = Keccak256.hashMultiple([
	new TextEncoder().encode(secret),
	challenge,
]);

console.log("Prover responds:");
console.log(`  Response: ${Hex.fromBytes(response)}\n`);

// Verifier checks (needs to know secret hash, not secret)
// In real ZK proof, verifier wouldn't know secret
const expectedResponse = Keccak256.hashMultiple([
	new TextEncoder().encode(secret),
	challenge,
]);

console.log("Verification:");
console.log(
	`  Valid: ${Hex.fromBytes(response) === Hex.fromBytes(expectedResponse)}`,
);
console.log("  (Prover knows secret without revealing it)\n");

console.log("=== Complete ===");
