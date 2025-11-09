import { bls12_381 } from "@noble/curves/bls12-381.js";

// Helper function to sign a message
function signMessage(privateKey: bigint, message: Uint8Array) {
	const msgHash = bls12_381.G1.hashToCurve(message, {
		DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
	});
	return msgHash.multiply(privateKey);
}

const numValidators = 5;
const validators = Array.from({ length: numValidators }, (_, i) => {
	const privKey = BigInt(100 + i * 111); // Deterministic for demo
	const pubKey = bls12_381.G2.Point.BASE.multiply(privKey);
	return { privKey, pubKey, index: i };
});
validators.forEach((v) => {});

const sharedMessage = new TextEncoder().encode("Block root: 0xabcd1234...");

const signatures = validators.map((v) => {
	const sig = signMessage(v.privKey, sharedMessage);
	return sig;
});

// Simply add all G1 signature points together
let aggregatedSignature = signatures[0];
for (let i = 1; i < signatures.length; i++) {
	aggregatedSignature = aggregatedSignature.add(signatures[i]);
}

let aggregatedPubKey = validators[0].pubKey;
for (let i = 1; i < validators.length; i++) {
	aggregatedPubKey = aggregatedPubKey.add(validators[i].pubKey);
}

const messageHash = bls12_381.G1.hashToCurve(sharedMessage, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});

// Verification: e(aggSig, G2) = e(H(msg), aggPubKey)
const lhs = bls12_381.pairing(aggregatedSignature, bls12_381.G2.Point.BASE);
const rhs = bls12_381.pairing(messageHash, aggregatedPubKey);
const valid = lhs.equals(rhs);

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

// Simulate signatures arriving one at a time
let incrementalSig = signatures[0];
let incrementalPubKey = validators[0].pubKey;

for (let i = 1; i < signatures.length; i++) {
	incrementalSig = incrementalSig.add(signatures[i]);
	incrementalPubKey = incrementalPubKey.add(validators[i].pubKey);
}

// Simulate sync committee with participation bitfield
const syncCommitteeSize = 512;
const participation = new Array(syncCommitteeSize).fill(true).map(
	(_, i) => Math.random() > 0.1, // 90% participation rate
);
const participantCount = participation.filter((p) => p).length;

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
