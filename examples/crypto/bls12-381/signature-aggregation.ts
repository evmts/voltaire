import { bls12_381 } from "@noble/curves/bls12-381.js";

/**
 * BLS Signature Aggregation
 *
 * Demonstrates signature aggregation for same message:
 * - Aggregate multiple signatures into one
 * - Aggregate public keys
 * - Verify aggregated signature with single pairing check
 * - Ethereum sync committee pattern
 */

console.log("=== BLS Signature Aggregation ===\n");

// Helper function to sign a message
function signMessage(privateKey: bigint, message: Uint8Array) {
	const msgHash = bls12_381.G1.hashToCurve(message, {
		DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
	});
	return msgHash.multiply(privateKey);
}

// 1. Setup - Multiple Validators
console.log("1. Setup - Multiple Validators");
console.log("-".repeat(50));

const numValidators = 5;
const validators = Array.from({ length: numValidators }, (_, i) => {
	const privKey = BigInt(100 + i * 111); // Deterministic for demo
	const pubKey = bls12_381.G2.Point.BASE.multiply(privKey);
	return { privKey, pubKey, index: i };
});

console.log("Number of validators:", numValidators);
validators.forEach((v) => {
	console.log(
		`Validator ${v.index}: privkey=${v.privKey}, pubkey=(${v.pubKey.toAffine().x.c0.toString(16).slice(0, 12)}...)`,
	);
});
console.log();

// 2. All Validators Sign Same Message
console.log("2. All Validators Sign Same Message");
console.log("-".repeat(50));

const sharedMessage = new TextEncoder().encode("Block root: 0xabcd1234...");
console.log("Message:", new TextDecoder().decode(sharedMessage));

const signatures = validators.map((v) => {
	const sig = signMessage(v.privKey, sharedMessage);
	console.log(
		`Validator ${v.index} signature: ${sig.toAffine().x.toString(16).slice(0, 12)}...`,
	);
	return sig;
});
console.log();

// 3. Aggregate Signatures
console.log("3. Aggregate Signatures (Point Addition)");
console.log("-".repeat(50));

// Simply add all G1 signature points together
let aggregatedSignature = signatures[0];
for (let i = 1; i < signatures.length; i++) {
	aggregatedSignature = aggregatedSignature.add(signatures[i]);
}

console.log(
	"Individual signatures:",
	signatures.length,
	"× 48 bytes =",
	signatures.length * 48,
	"bytes",
);
console.log("Aggregated signature: 1 × 48 bytes = 48 bytes");
console.log(
	"Bandwidth savings:",
	(((signatures.length * 48 - 48) / (signatures.length * 48)) * 100).toFixed(1),
	"%",
);
console.log(
	"\nAggregated signature:",
	aggregatedSignature.toAffine().x.toString(16).slice(0, 16),
	"...\n",
);

// 4. Aggregate Public Keys
console.log("4. Aggregate Public Keys");
console.log("-".repeat(50));

let aggregatedPubKey = validators[0].pubKey;
for (let i = 1; i < validators.length; i++) {
	aggregatedPubKey = aggregatedPubKey.add(validators[i].pubKey);
}

console.log(
	"Aggregated public key (x.c0):",
	aggregatedPubKey.toAffine().x.c0.toString(16).slice(0, 16),
	"...\n",
);

// 5. Verify Aggregated Signature
console.log("5. Verify Aggregated Signature");
console.log("-".repeat(50));

const messageHash = bls12_381.G1.hashToCurve(sharedMessage, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});

// Verification: e(aggSig, G2) = e(H(msg), aggPubKey)
const lhs = bls12_381.pairing(aggregatedSignature, bls12_381.G2.Point.BASE);
const rhs = bls12_381.pairing(messageHash, aggregatedPubKey);
const valid = lhs.equals(rhs);

console.log("Verification equation: e(aggSig, G2) = e(H(msg), aggPubKey)");
console.log("Aggregated signature valid:", valid);
console.log("\nVerification cost: 2 pairings (~2ms)");
console.log(
	"vs individual verification:",
	numValidators * 2,
	"pairings (~" + numValidators * 2 + "ms)",
);
console.log("Speedup:", numValidators + "x faster\n");

// 6. Partial Aggregation (Subset of Validators)
console.log("6. Partial Aggregation (Subset of Validators)");
console.log("-".repeat(50));

// Only validators 0, 2, 4 participate
const participantIndices = [0, 2, 4];
const participantSigs = participantIndices.map((i) => signatures[i]);
const participantPubKeys = participantIndices.map((i) => validators[i].pubKey);

let partialSig = participantSigs[0];
for (let i = 1; i < participantSigs.length; i++) {
	partialSig = partialSig.add(participantSigs[i]);
}

let partialPubKey = participantPubKeys[0];
for (let i = 1; i < participantPubKeys.length; i++) {
	partialPubKey = partialPubKey.add(participantPubKeys[i]);
}

const partialLhs = bls12_381.pairing(partialSig, bls12_381.G2.Point.BASE);
const partialRhs = bls12_381.pairing(messageHash, partialPubKey);
const partialValid = partialLhs.equals(partialRhs);

console.log("Participants:", participantIndices.join(", "));
console.log("Partial aggregation valid:", partialValid, "\n");

// 7. Incremental Aggregation
console.log("7. Incremental Aggregation (As Signatures Arrive)");
console.log("-".repeat(50));

// Simulate signatures arriving one at a time
let incrementalSig = signatures[0];
let incrementalPubKey = validators[0].pubKey;
console.log("Initial: 1 signature aggregated");

for (let i = 1; i < signatures.length; i++) {
	incrementalSig = incrementalSig.add(signatures[i]);
	incrementalPubKey = incrementalPubKey.add(validators[i].pubKey);
	console.log(`Added signature ${i + 1}: now ${i + 1} signatures aggregated`);
}

// Verify incremental aggregate matches full aggregate
console.log(
	"\nIncremental matches full aggregate:",
	incrementalSig.equals(aggregatedSignature),
);
console.log("Order of aggregation does not matter (commutative)\n");

// 8. Ethereum Sync Committee Pattern
console.log("8. Ethereum Sync Committee Pattern (512 validators)");
console.log("-".repeat(50));

// Simulate sync committee with participation bitfield
const syncCommitteeSize = 512;
const participation = new Array(syncCommitteeSize).fill(true).map(
	(_, i) => Math.random() > 0.1, // 90% participation rate
);
const participantCount = participation.filter((p) => p).length;

console.log("Sync committee size:", syncCommitteeSize);
console.log(
	"Participants:",
	participantCount,
	"(" + ((participantCount / syncCommitteeSize) * 100).toFixed(1) + "%)",
);
console.log("Non-participants:", syncCommitteeSize - participantCount);

console.log("\nParticipation bitfield: 512 bits = 64 bytes");
console.log("Aggregated signature: 48 bytes");
console.log("Total data: 112 bytes");

console.log("\nvs individual signatures:", syncCommitteeSize * 48, "bytes");
console.log(
	"Compression ratio:",
	((syncCommitteeSize * 48) / 112).toFixed(1) + "x\n",
);

// 9. Security - Rogue Key Attack Prevention
console.log("9. Security - Rogue Key Attack Prevention");
console.log("-".repeat(50));

console.log("Rogue key attack scenario:");
console.log(
	"  Attacker chooses: pubkey_attack = pubkey_target - pubkey_honest",
);
console.log("  Aggregated: pubkey_honest + pubkey_attack = pubkey_target");
console.log("  Attacker can forge signatures for target!\n");

console.log("Mitigation - Proof of Possession (PoP):");
console.log("  Each validator must prove they know private key");
console.log("  PoP = Sign(pubkey) with privkey");
console.log("  Verified during validator deposit");
console.log("  Prevents rogue key attacks in aggregation\n");

// 10. Complete Aggregation Workflow
console.log("10. Complete Aggregation Workflow");
console.log("-".repeat(50));

function aggregateSignatures(
	sigs: typeof signatures,
): typeof aggregatedSignature {
	if (sigs.length === 0) throw new Error("No signatures to aggregate");
	let agg = sigs[0];
	for (let i = 1; i < sigs.length; i++) {
		agg = agg.add(sigs[i]);
	}
	return agg;
}

function aggregatePublicKeys(
	pubKeys: (typeof validators)[0]["pubKey"][],
): typeof aggregatedPubKey {
	if (pubKeys.length === 0) throw new Error("No public keys to aggregate");
	let agg = pubKeys[0];
	for (let i = 1; i < pubKeys.length; i++) {
		agg = agg.add(pubKeys[i]);
	}
	return agg;
}

function verifyAggregated(
	aggSig: typeof aggregatedSignature,
	aggPubKey: typeof aggregatedPubKey,
	msg: Uint8Array,
): boolean {
	const msgHash = bls12_381.G1.hashToCurve(msg, {
		DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
	});
	const lhs = bls12_381.pairing(aggSig, bls12_381.G2.Point.BASE);
	const rhs = bls12_381.pairing(msgHash, aggPubKey);
	return lhs.equals(rhs);
}

const testMsg = new TextEncoder().encode("Test aggregation");
const testSigs = validators.map((v) => signMessage(v.privKey, testMsg));
const testPubKeys = validators.map((v) => v.pubKey);

const testAggSig = aggregateSignatures(testSigs);
const testAggPubKey = aggregatePublicKeys(testPubKeys);
const testValid = verifyAggregated(testAggSig, testAggPubKey, testMsg);

console.log("Workflow test:");
console.log("  1. Collect", validators.length, "signatures");
console.log("  2. Aggregate signatures -> 1 signature");
console.log("  3. Aggregate public keys -> 1 public key");
console.log("  4. Verify with single pairing check");
console.log("\nResult:", testValid ? "VALID" : "INVALID", "\n");

console.log("=== Complete ===");
