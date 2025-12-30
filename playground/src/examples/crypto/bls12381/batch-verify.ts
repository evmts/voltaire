import { Bls12381, Hex } from "@tevm/voltaire";
// Batch verify - different messages case

// batchVerify handles the case where each signer signed a DIFFERENT message
// This is less common but still useful for certain protocols

// Generate signers
const pk1 = Bls12381.randomPrivateKey();
const pk2 = Bls12381.randomPrivateKey();
const pk3 = Bls12381.randomPrivateKey();

const pub1 = Bls12381.derivePublicKey(pk1);
const pub2 = Bls12381.derivePublicKey(pk2);
const pub3 = Bls12381.derivePublicKey(pk3);

// Each signer signs a DIFFERENT message
const msg1 = new TextEncoder().encode("Transaction A");
const msg2 = new TextEncoder().encode("Transaction B");
const msg3 = new TextEncoder().encode("Transaction C");

const sig1 = Bls12381.sign(msg1, pk1);
const sig2 = Bls12381.sign(msg2, pk2);
const sig3 = Bls12381.sign(msg3, pk3);

// Aggregate signatures (still works with different messages)
const aggregatedSig = Bls12381.aggregate([sig1, sig2, sig3]);

// Batch verify: check aggregated sig against message-pubkey pairs
const isValid = Bls12381.batchVerify(
	aggregatedSig,
	[msg1, msg2, msg3],
	[pub1, pub2, pub3],
);
console.log("Batch verify (different messages):", isValid);

// Order matters: messages and pubkeys must match
const wrongOrder = Bls12381.batchVerify(
	aggregatedSig,
	[msg2, msg1, msg3], // swapped msg1 and msg2
	[pub1, pub2, pub3],
);
console.log("Wrong order:", wrongOrder);

// Missing one pair fails
const missingPair = Bls12381.batchVerify(
	aggregatedSig,
	[msg1, msg2],
	[pub1, pub2],
);
console.log("Missing pair:", missingPair);

// Compare with individual verification
const allValid =
	Bls12381.verify(sig1, msg1, pub1) &&
	Bls12381.verify(sig2, msg2, pub2) &&
	Bls12381.verify(sig3, msg3, pub3);
console.log("All individually valid:", allValid);

// Use case: verify multiple independent signatures efficiently
console.log("\nBatch verification use case:");
const numSigners = 10;
const signers = Array.from({ length: numSigners }, (_, i) => {
	const sk = Bls12381.randomPrivateKey();
	const pk = Bls12381.derivePublicKey(sk);
	const msg = new TextEncoder().encode(`Transaction ${i}`);
	const sig = Bls12381.sign(msg, sk);
	return { publicKey: pk, message: msg, signature: sig };
});

const allSigs = signers.map((s) => s.signature);
const allMsgs = signers.map((s) => s.message);
const allPubs = signers.map((s) => s.publicKey);

const aggSig = Bls12381.aggregate(allSigs);
const batchValid = Bls12381.batchVerify(aggSig, allMsgs, allPubs);
console.log(`Batch of ${numSigners} signatures valid:`, batchValid);
