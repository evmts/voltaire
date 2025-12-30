import { Bls12381, Hex } from "@tevm/voltaire";
// Beacon Chain validator signature example

// Simulates how Ethereum's Beacon Chain uses BLS signatures
// for validator attestations and block proposals

// === Validator Setup ===
// Each validator has a BLS keypair
const NUM_VALIDATORS = 5;
const validators = Array.from({ length: NUM_VALIDATORS }, (_, i) => {
	const secretKey = Bls12381.randomPrivateKey();
	const publicKey = Bls12381.derivePublicKey(secretKey);
	return {
		index: i,
		secretKey,
		publicKey,
	};
});
console.log(`Initialized ${NUM_VALIDATORS} validators`);

// === Block Attestation ===
// Validators attest to a block by signing the block root
const slot = 12345;
const blockRoot = new Uint8Array(32);
blockRoot.set(new TextEncoder().encode(`block_${slot}`));

// Create attestation data (simplified)
const attestationData = new TextEncoder().encode(
	JSON.stringify({
		slot,
		beacon_block_root: Hex.fromBytes(blockRoot),
		source_epoch: 385,
		target_epoch: 386,
	}),
);

console.log("\n=== Attestation Phase ===");
console.log("Slot:", slot);

// Each validator signs the attestation
const attestations = validators.map((v) => ({
	validatorIndex: v.index,
	signature: Bls12381.sign(attestationData, v.secretKey),
	publicKey: v.publicKey,
}));

console.log("Individual attestation signatures:");
attestations.forEach((a) => {
	console.log(`  Validator ${a.validatorIndex}: ${a.signature.length} bytes`);
});

// === Signature Aggregation ===
// Aggregate all attestation signatures
console.log("\n=== Aggregation Phase ===");
const signatures = attestations.map((a) => a.signature);
const publicKeys = attestations.map((a) => a.publicKey);

const aggregatedSignature = Bls12381.aggregate(signatures);
const aggregatedPublicKey = Bls12381.aggregatePublicKeys(publicKeys);

console.log("Aggregated signature:", aggregatedSignature.length, "bytes");
console.log("Aggregated pubkey:", aggregatedPublicKey.length, "bytes");
console.log(
	"Space saved:",
	signatures.length * 48 - 48,
	"bytes for signatures",
);

// === Verification ===
console.log("\n=== Verification Phase ===");
// Fast aggregate verify (all signed same message)
const isValid = Bls12381.fastAggregateVerify(
	aggregatedSignature,
	attestationData,
	aggregatedPublicKey,
);
console.log("Aggregate attestation valid:", isValid);

// === Block Proposal ===
// A proposer signs the block
console.log("\n=== Block Proposal ===");
const proposer = validators[0];
const blockData = new TextEncoder().encode(
	JSON.stringify({
		slot,
		proposer_index: proposer.index,
		parent_root: Hex.fromBytes(blockRoot),
		state_root: "0x" + "ab".repeat(32),
		body_root: "0x" + "cd".repeat(32),
	}),
);

const blockSignature = Bls12381.sign(blockData, proposer.secretKey);
console.log("Block signature:", blockSignature.length, "bytes");

const blockValid = Bls12381.verify(
	blockSignature,
	blockData,
	proposer.publicKey,
);
console.log("Block signature valid:", blockValid);

// === Sync Committee ===
// Sync committee (subset of validators) signs for light clients
console.log("\n=== Sync Committee ===");
const syncCommittee = validators.slice(0, 3);
const syncMessage = new TextEncoder().encode(`sync_${slot}`);

const syncSigs = syncCommittee.map((v) =>
	Bls12381.sign(syncMessage, v.secretKey),
);
const syncPubs = syncCommittee.map((v) => v.publicKey);

const syncAggSig = Bls12381.aggregate(syncSigs);
const syncAggPub = Bls12381.aggregatePublicKeys(syncPubs);

const syncValid = Bls12381.fastAggregateVerify(
	syncAggSig,
	syncMessage,
	syncAggPub,
);
console.log("Sync committee signature valid:", syncValid);
console.log("Committee size:", syncCommittee.length);

// === Summary ===
console.log("\n=== Summary ===");
console.log("BLS enables Ethereum consensus to:");
console.log("- Aggregate 100,000+ validator signatures into 1");
console.log("- Verify attestations with single pairing check");
console.log("- Keep block sizes small despite many validators");
