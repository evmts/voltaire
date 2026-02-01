import { Bls12381, Hex } from "@tevm/voltaire";
// Aggregate BLS signatures

// The main advantage of BLS: aggregate N signatures into 1
// Result is same size (48 bytes) regardless of how many signatures

const message = new TextEncoder().encode("Block attestation #12345");

// Generate 5 validators
const validators = Array.from({ length: 5 }, () => {
	const sk = Bls12381.randomPrivateKey();
	const pk = Bls12381.derivePublicKey(sk);
	return { secretKey: sk, publicKey: pk };
});

// Each validator signs the same message
const signatures = validators.map((v) => Bls12381.sign(message, v.secretKey));

// Aggregate all signatures into one
const aggregatedSig = Bls12381.aggregate(signatures);

// Aggregate in steps (associative)
const sig12 = Bls12381.aggregate([signatures[0], signatures[1]]);
const sig34 = Bls12381.aggregate([signatures[2], signatures[3]]);
const sig1234 = Bls12381.aggregate([sig12, sig34]);
const sig12345 = Bls12381.aggregate([sig1234, signatures[4]]);

// Aggregate 2 signatures
const twoSigs = Bls12381.aggregate([signatures[0], signatures[1]]);

// Aggregate 100 signatures (scales well)
const manyValidators = Array.from({ length: 100 }, () => {
	const sk = Bls12381.randomPrivateKey();
	return Bls12381.sign(message, sk);
});
const manyAggregated = Bls12381.aggregate(manyValidators);
