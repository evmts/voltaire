import { Bls12381, Hex } from "@tevm/voltaire";
// Fast aggregate verify - same message case

// fastAggregateVerify is optimized for the common case:
// Multiple signers all signed the SAME message
// Uses pre-aggregated public key for single pairing check

const message = new TextEncoder().encode("Slot 12345 attestation");

// Generate validators
const pk1 = Bls12381.randomPrivateKey();
const pk2 = Bls12381.randomPrivateKey();
const pk3 = Bls12381.randomPrivateKey();

const pub1 = Bls12381.derivePublicKey(pk1);
const pub2 = Bls12381.derivePublicKey(pk2);
const pub3 = Bls12381.derivePublicKey(pk3);

// Each validator signs the same message
const sig1 = Bls12381.sign(message, pk1);
const sig2 = Bls12381.sign(message, pk2);
const sig3 = Bls12381.sign(message, pk3);

// Aggregate signatures
const aggregatedSig = Bls12381.aggregate([sig1, sig2, sig3]);

// Aggregate public keys
const aggregatedPubKey = Bls12381.aggregatePublicKeys([pub1, pub2, pub3]);

// Fast aggregate verify: single pairing check
const isValid = Bls12381.fastAggregateVerify(
	aggregatedSig,
	message,
	aggregatedPubKey,
);
console.log("Fast aggregate verify:", isValid);

// Compare: this is equivalent to checking all individual signatures
// but much more efficient (1 pairing vs N pairings)
const allIndividuallyValid =
	Bls12381.verify(sig1, message, pub1) &&
	Bls12381.verify(sig2, message, pub2) &&
	Bls12381.verify(sig3, message, pub3);
console.log("All individually valid:", allIndividuallyValid);

// Wrong aggregated pubkey fails
const wrongPubKeys = Bls12381.aggregatePublicKeys([pub1, pub2]); // missing pub3
const wrongResult = Bls12381.fastAggregateVerify(
	aggregatedSig,
	message,
	wrongPubKeys,
);
console.log("Wrong pubkey aggregate:", wrongResult);

// Wrong message fails
const wrongMessage = new TextEncoder().encode("Different message");
const wrongMsgResult = Bls12381.fastAggregateVerify(
	aggregatedSig,
	wrongMessage,
	aggregatedPubKey,
);
console.log("Wrong message:", wrongMsgResult);

// Beacon chain use case: verify committee attestation
console.log("\nBeacon chain committee verification:");
const committeeSize = 10;
const committee = Array.from({ length: committeeSize }, () => {
	const sk = Bls12381.randomPrivateKey();
	const pk = Bls12381.derivePublicKey(sk);
	const sig = Bls12381.sign(message, sk);
	return { secretKey: sk, publicKey: pk, signature: sig };
});

const committeeSigs = committee.map((v) => v.signature);
const committeePubs = committee.map((v) => v.publicKey);

const committeeAggSig = Bls12381.aggregate(committeeSigs);
const committeeAggPub = Bls12381.aggregatePublicKeys(committeePubs);

const committeeValid = Bls12381.fastAggregateVerify(
	committeeAggSig,
	message,
	committeeAggPub,
);
console.log(`Committee of ${committeeSize} valid:`, committeeValid);
