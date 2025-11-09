import { randomBytes } from "node:crypto";
import { bls12_381 } from "@noble/curves/bls12-381.js";

// Constants
const SYNC_COMMITTEE_SIZE = 512;
const PARTICIPATION_RATE = 0.85; // 85% participation

// Helper: Sign message
function signMessage(privateKey: bigint, message: Uint8Array) {
	const msgHash = bls12_381.G1.hashToCurve(message, {
		DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_SYNC_COMMITTEE_",
	});
	return msgHash.multiply(privateKey);
}

// Generate 512 validators (use small indices for demo)
const syncCommittee = Array.from({ length: SYNC_COMMITTEE_SIZE }, (_, i) => {
	// In production, use secure random private keys
	const privKey = BigInt(1000 + i);
	const pubKey = bls12_381.G2.Point.BASE.multiply(privKey);
	return {
		index: i,
		privKey,
		pubKey,
		pubKeyBytes: pubKey.toRawBytes(true), // Compressed 96 bytes
	};
});

// Simulate beacon block root (32 bytes)
const blockRoot = randomBytes(32);
const blockRootHex = `0x${Buffer.from(blockRoot).toString("hex")}`;

// Random participation (85% of validators online)
const participationBits = Array.from(
	{ length: SYNC_COMMITTEE_SIZE },
	() => Math.random() < PARTICIPATION_RATE,
);
const participantCount = participationBits.filter((p) => p).length;

// Encode participation as bitfield (64 bytes for 512 bits)
const participationBytes = new Uint8Array(64);
for (let i = 0; i < SYNC_COMMITTEE_SIZE; i++) {
	if (participationBits[i]) {
		const byteIndex = Math.floor(i / 8);
		const bitIndex = i % 8;
		participationBytes[byteIndex] |= 1 << bitIndex;
	}
}

const participatingValidators = syncCommittee.filter(
	(_, i) => participationBits[i],
);
const signatures = participatingValidators.map((v) =>
	signMessage(v.privKey, blockRoot),
);

const startAgg = Date.now();
let aggregatedSignature = signatures[0];
for (let i = 1; i < signatures.length; i++) {
	aggregatedSignature = aggregatedSignature.add(signatures[i]);
}
const aggTime = Date.now() - startAgg;

interface SyncAggregate {
	syncCommitteeBits: Uint8Array; // 64 bytes (512 bits)
	syncCommitteeSignature: Uint8Array; // 48 bytes compressed
}

const syncAggregate: SyncAggregate = {
	syncCommitteeBits: participationBytes,
	syncCommitteeSignature: aggregatedSignature.toRawBytes(true),
};

const totalSize =
	syncAggregate.syncCommitteeBits.length +
	syncAggregate.syncCommitteeSignature.length;

// Light client has sync committee public keys
const participatingPubKeys = participatingValidators.map((v) => v.pubKey);

// Aggregate public keys
let aggregatedPubKey = participatingPubKeys[0];
for (let i = 1; i < participatingPubKeys.length; i++) {
	aggregatedPubKey = aggregatedPubKey.add(participatingPubKeys[i]);
}

// Verify aggregated signature
const messageHash = bls12_381.G1.hashToCurve(blockRoot, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_SYNC_COMMITTEE_",
});

const startVerify = Date.now();
const lhs = bls12_381.pairing(aggregatedSignature, bls12_381.G2.Point.BASE);
const rhs = bls12_381.pairing(messageHash, aggregatedPubKey);
const valid = lhs.equals(rhs);
const verifyTime = Date.now() - startVerify;

const SUPERMAJORITY_THRESHOLD = Math.floor((SYNC_COMMITTEE_SIZE * 2) / 3); // 66.7%
const hasSupermajority = participantCount >= SUPERMAJORITY_THRESHOLD;

const EPOCHS_PER_SYNC_COMMITTEE_PERIOD = 256; // 256 epochs ≈ 27 hours
const SLOTS_PER_EPOCH = 32;
const SECONDS_PER_SLOT = 12;

const periodDuration =
	EPOCHS_PER_SYNC_COMMITTEE_PERIOD * SLOTS_PER_EPOCH * SECONDS_PER_SLOT;
const hours = periodDuration / 3600;

const blocksPerDay = (24 * 60 * 60) / SECONDS_PER_SLOT;
const syncAggregatePerDay = blocksPerDay;
const bandwidthPerDay = syncAggregatePerDay * totalSize;
