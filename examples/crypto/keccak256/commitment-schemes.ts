import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Alice commits to her choice
const aliceChoice = "rock";
const aliceNonce = crypto.getRandomValues(new Uint8Array(32));

const commitment = Keccak256.hashMultiple([
	new TextEncoder().encode(aliceChoice),
	aliceNonce,
]);

// Bob makes his choice (cannot change after seeing commitment)
const bobChoice = "paper";
const revealed = Keccak256.hashMultiple([
	new TextEncoder().encode(aliceChoice),
	aliceNonce,
]);

const verified = Hex.fromBytes(commitment) === Hex.fromBytes(revealed);

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
}
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

	if (valid && bid.amount > highestBid) {
		highestBid = bid.amount;
		winner = bid.bidder;
	}
}

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
const verifyHash = Keccak256.hashString(document);
const verifyCommitment = Keccak256.hashMultiple([verifyHash, timestampBytes]);

// Build Merkle tree
const leaves = [
	Keccak256.hashString("Transaction 1"),
	Keccak256.hashString("Transaction 2"),
	Keccak256.hashString("Transaction 3"),
	Keccak256.hashString("Transaction 4"),
];
for (let i = 0; i < leaves.length; i++) {}

// Build tree
const level1 = [
	Keccak256.hashMultiple([leaves[0], leaves[1]]),
	Keccak256.hashMultiple([leaves[2], leaves[3]]),
];

const root = Keccak256.hashMultiple([level1[0], level1[1]]);

// Prove Transaction 2 is included
const proofIndex = 1; // Transaction 2
const proof = [
	leaves[0], // Sibling
	level1[1], // Uncle
];

// Verify proof
const step1 = Keccak256.hashMultiple([proof[0], leaves[proofIndex]]);
const computedRoot = Keccak256.hashMultiple([step1, proof[1]]);

// Seed-based randomness
const seed = crypto.getRandomValues(new Uint8Array(32));
const input = new TextEncoder().encode("block-123");

// Generate "random" output
const output = Keccak256.hashMultiple([seed, input]);

// Anyone can verify with same inputs
const verifyOutput = Keccak256.hashMultiple([seed, input]);

const chainLength = 5;
const initialSecret = crypto.getRandomValues(new Uint8Array(32));

// Build chain backwards
const chain: Uint8Array[] = [initialSecret];
for (let i = 1; i < chainLength; i++) {
	const next = Keccak256.hash(chain[chain.length - 1]);
	chain.push(next);
}
for (let i = 0; i < chain.length; i++) {}

// Publish only the final hash
const publicCommitment = chain[chain.length - 1];
for (let i = chain.length - 2; i >= 0; i--) {
	const password = chain[i];
	const hashed = Keccak256.hash(password);

	// Verify against previous commitment
	const expectedCommitment = chain[i + 1];
	const valid = Hex.fromBytes(hashed) === Hex.fromBytes(expectedCommitment);
}

const secret = "my-secret-password";
const secretHash = Keccak256.hashString(secret);

// Challenge-response
const challenge = crypto.getRandomValues(new Uint8Array(32));

// Prover responds with hash(secret || challenge)
const response = Keccak256.hashMultiple([
	new TextEncoder().encode(secret),
	challenge,
]);

// Verifier checks (needs to know secret hash, not secret)
// In real ZK proof, verifier wouldn't know secret
const expectedResponse = Keccak256.hashMultiple([
	new TextEncoder().encode(secret),
	challenge,
]);
