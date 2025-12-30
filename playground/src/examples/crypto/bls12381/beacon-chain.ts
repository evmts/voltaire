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

// Each validator signs the attestation
const attestations = validators.map((v) => ({
	validatorIndex: v.index,
	signature: Bls12381.sign(attestationData, v.secretKey),
	publicKey: v.publicKey,
}));
attestations.forEach((a) => {});
const signatures = attestations.map((a) => a.signature);
const publicKeys = attestations.map((a) => a.publicKey);

const aggregatedSignature = Bls12381.aggregate(signatures);
const aggregatedPublicKey = Bls12381.aggregatePublicKeys(publicKeys);
// Fast aggregate verify (all signed same message)
const isValid = Bls12381.fastAggregateVerify(
	aggregatedSignature,
	attestationData,
	aggregatedPublicKey,
);
const proposer = validators[0];
const blockData = new TextEncoder().encode(
	JSON.stringify({
		slot,
		proposer_index: proposer.index,
		parent_root: Hex.fromBytes(blockRoot),
		state_root: `0x${"ab".repeat(32)}`,
		body_root: `0x${"cd".repeat(32)}`,
	}),
);

const blockSignature = Bls12381.sign(blockData, proposer.secretKey);

const blockValid = Bls12381.verify(
	blockSignature,
	blockData,
	proposer.publicKey,
);
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
