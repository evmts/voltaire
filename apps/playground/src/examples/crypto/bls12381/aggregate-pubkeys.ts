import { Bls12381, Hex } from "@tevm/voltaire";
// Aggregate BLS public keys

// When all signers sign the same message, we can:
// 1. Aggregate signatures
// 2. Aggregate public keys
// 3. Verify with single pairing check

// Generate 3 validators
const pk1 = Bls12381.randomPrivateKey();
const pk2 = Bls12381.randomPrivateKey();
const pk3 = Bls12381.randomPrivateKey();

const pub1 = Bls12381.derivePublicKey(pk1);
const pub2 = Bls12381.derivePublicKey(pk2);
const pub3 = Bls12381.derivePublicKey(pk3);

// Aggregate public keys
const aggregatedPubKey = Bls12381.aggregatePublicKeys([pub1, pub2, pub3]);

// Aggregate 2 public keys
const aggPub12 = Bls12381.aggregatePublicKeys([pub1, pub2]);

// Aggregation is associative: (a + b) + c = a + (b + c)
const aggPub12Then3 = Bls12381.aggregatePublicKeys([aggPub12, pub3]);

// Aggregate many public keys
const manyPubKeys = Array.from({ length: 50 }, () => {
	const sk = Bls12381.randomPrivateKey();
	return Bls12381.derivePublicKey(sk);
});
const manyAggregated = Bls12381.aggregatePublicKeys(manyPubKeys);
const committeeSize = 128;
const committeePubKeys = Array.from({ length: committeeSize }, () => {
	const sk = Bls12381.randomPrivateKey();
	return Bls12381.derivePublicKey(sk);
});
const committeeAggregate = Bls12381.aggregatePublicKeys(committeePubKeys);
