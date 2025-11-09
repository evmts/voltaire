import { bls12_381 } from "@noble/curves/bls12-381.js";
import { randomBytes } from "crypto";

/**
 * Ethereum Sync Committee Example
 *
 * Demonstrates real-world Ethereum 2.0 sync committee:
 * - 512 validator sync committee
 * - Partial participation tracking
 * - Signature aggregation for light clients
 * - Efficient verification
 */

console.log("=== Ethereum Sync Committee Example ===\n");

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

// 1. Setup Sync Committee
console.log("1. Setup Sync Committee");
console.log("-".repeat(60));

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

console.log("Sync committee size:", SYNC_COMMITTEE_SIZE);
console.log("First validator privkey:", syncCommittee[0].privKey);
console.log(
	"First validator pubkey (compressed):",
	Buffer.from(syncCommittee[0].pubKeyBytes).toString("hex").slice(0, 32),
	"...",
);
console.log("Public key size: 96 bytes compressed\n");

// 2. Beacon Block to Sign
console.log("2. Beacon Block to Sign");
console.log("-".repeat(60));

// Simulate beacon block root (32 bytes)
const blockRoot = randomBytes(32);
const blockRootHex = "0x" + Buffer.from(blockRoot).toString("hex");

console.log("Block root:", blockRootHex.slice(0, 20), "...");
console.log("All sync committee members sign the same block root\n");

// 3. Simulate Participation
console.log("3. Simulate Validator Participation");
console.log("-".repeat(60));

// Random participation (85% of validators online)
const participationBits = Array.from(
	{ length: SYNC_COMMITTEE_SIZE },
	() => Math.random() < PARTICIPATION_RATE,
);
const participantCount = participationBits.filter((p) => p).length;

console.log(
	"Expected participation:",
	(PARTICIPATION_RATE * 100).toFixed(1),
	"%",
);
console.log("Actual participants:", participantCount, "/", SYNC_COMMITTEE_SIZE);
console.log(
	"Participation rate:",
	((participantCount / SYNC_COMMITTEE_SIZE) * 100).toFixed(1),
	"%",
);

// Encode participation as bitfield (64 bytes for 512 bits)
const participationBytes = new Uint8Array(64);
for (let i = 0; i < SYNC_COMMITTEE_SIZE; i++) {
	if (participationBits[i]) {
		const byteIndex = Math.floor(i / 8);
		const bitIndex = i % 8;
		participationBytes[byteIndex] |= 1 << bitIndex;
	}
}

console.log("Participation bitfield: 64 bytes");
console.log(
	"Bitfield (first 16 bytes):",
	Buffer.from(participationBytes.subarray(0, 16)).toString("hex"),
	"...\n",
);

// 4. Collect Signatures
console.log("4. Collect Signatures from Participants");
console.log("-".repeat(60));

const participatingValidators = syncCommittee.filter(
	(_, i) => participationBits[i],
);
const signatures = participatingValidators.map((v) =>
	signMessage(v.privKey, blockRoot),
);

console.log("Signatures collected:", signatures.length);
console.log(
	"First signature (x):",
	signatures[0].toAffine().x.toString(16).slice(0, 16),
	"...",
);
console.log(
	"Last signature (x):",
	signatures[signatures.length - 1].toAffine().x.toString(16).slice(0, 16),
	"...\n",
);

// 5. Aggregate Signatures
console.log("5. Aggregate Signatures");
console.log("-".repeat(60));

const startAgg = Date.now();
let aggregatedSignature = signatures[0];
for (let i = 1; i < signatures.length; i++) {
	aggregatedSignature = aggregatedSignature.add(signatures[i]);
}
const aggTime = Date.now() - startAgg;

console.log(
	"Individual signatures:",
	signatures.length,
	"× 48 bytes =",
	signatures.length * 48,
	"bytes",
);
console.log("Aggregated signature: 1 × 48 bytes = 48 bytes");
console.log(
	"Compression ratio:",
	((signatures.length * 48) / 48).toFixed(1) + "x",
);
console.log("Aggregation time:", aggTime, "ms");
console.log(
	"\nAggregated signature (x):",
	aggregatedSignature.toAffine().x.toString(16).slice(0, 16),
	"...\n",
);

// 6. SyncAggregate Structure
console.log("6. SyncAggregate Data Structure");
console.log("-".repeat(60));

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
console.log("SyncAggregate structure:");
console.log("  - sync_committee_bits: 64 bytes (bitfield)");
console.log("  - sync_committee_signature: 48 bytes (aggregated)");
console.log("  - Total size:", totalSize, "bytes");
console.log("\nvs individual signatures:", participantCount * 48, "bytes");
console.log(
	"Bandwidth savings:",
	(1 - totalSize / (participantCount * 48)).toFixed(2) + "x or",
	((1 - totalSize / (participantCount * 48)) * 100).toFixed(1) + "%\n",
);

// 7. Verification (Light Client)
console.log("7. Verification by Light Client");
console.log("-".repeat(60));

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

console.log("Light client verification:");
console.log("  1. Parse participation bitfield");
console.log("  2. Aggregate", participantCount, "public keys");
console.log("  3. Hash block root to G1 point");
console.log("  4. Single pairing check");
console.log("\nVerification result:", valid ? "VALID" : "INVALID");
console.log("Verification time:", verifyTime, "ms");
console.log(
	"\nvs individual verification:",
	participantCount,
	"× ~2ms ≈",
	participantCount * 2,
	"ms",
);
console.log(
	"Speedup:",
	Math.round((participantCount * 2) / verifyTime) + "x faster\n",
);

// 8. Supermajority Check
console.log("8. Supermajority Threshold");
console.log("-".repeat(60));

const SUPERMAJORITY_THRESHOLD = Math.floor((SYNC_COMMITTEE_SIZE * 2) / 3); // 66.7%
const hasSupermajority = participantCount >= SUPERMAJORITY_THRESHOLD;

console.log(
	"Supermajority threshold: 2/3 =",
	SUPERMAJORITY_THRESHOLD,
	"validators",
);
console.log("Actual participants:", participantCount);
console.log("Has supermajority:", hasSupermajority);
console.log(
	"\nLight client accepts block:",
	hasSupermajority && valid ? "YES" : "NO\n",
);

// 9. Rotation (Sync Committee Updates)
console.log("9. Sync Committee Rotation");
console.log("-".repeat(60));

const EPOCHS_PER_SYNC_COMMITTEE_PERIOD = 256; // 256 epochs ≈ 27 hours
const SLOTS_PER_EPOCH = 32;
const SECONDS_PER_SLOT = 12;

const periodDuration =
	EPOCHS_PER_SYNC_COMMITTEE_PERIOD * SLOTS_PER_EPOCH * SECONDS_PER_SLOT;
const hours = periodDuration / 3600;

console.log(
	"Sync committee period:",
	EPOCHS_PER_SYNC_COMMITTEE_PERIOD,
	"epochs",
);
console.log("Duration:", hours.toFixed(1), "hours");
console.log("\nRotation process:");
console.log("  1. New committee randomly selected");
console.log("  2. Current committee signs blocks");
console.log("  3. Next committee prepared in advance");
console.log("  4. Smooth transition at period boundary\n");

// 10. Real-World Performance
console.log("10. Real-World Performance Implications");
console.log("-".repeat(60));

const blocksPerDay = (24 * 60 * 60) / SECONDS_PER_SLOT;
const syncAggregatePerDay = blocksPerDay;
const bandwidthPerDay = syncAggregatePerDay * totalSize;

console.log("Blocks per day:", blocksPerDay);
console.log("SyncAggregate per day:", syncAggregatePerDay);
console.log(
	"Bandwidth per day:",
	(bandwidthPerDay / 1024 / 1024).toFixed(2),
	"MB",
);
console.log(
	"\nvs individual signatures per day:",
	((syncAggregatePerDay * participantCount * 48) / 1024 / 1024).toFixed(2),
	"MB",
);
console.log(
	"Daily bandwidth savings:",
	(
		(syncAggregatePerDay * participantCount * 48 - bandwidthPerDay) /
		1024 /
		1024
	).toFixed(2),
	"MB\n",
);

console.log("Light client benefits:");
console.log("  - Minimal bandwidth (112 bytes per block)");
console.log("  - Fast verification (single pairing)");
console.log("  - High security (supermajority consensus)");
console.log("  - Enables mobile/browser light clients\n");

console.log("=== Complete ===");
