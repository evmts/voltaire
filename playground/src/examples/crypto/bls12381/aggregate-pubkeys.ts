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

console.log("Individual public key sizes:");
console.log("  pub1:", pub1.length, "bytes");
console.log("  pub2:", pub2.length, "bytes");
console.log("  pub3:", pub3.length, "bytes");

// Aggregate public keys
const aggregatedPubKey = Bls12381.aggregatePublicKeys([pub1, pub2, pub3]);
console.log("Aggregated public key:", aggregatedPubKey.length, "bytes");
console.log(
	"Aggregated pubkey hex:",
	Hex.fromBytes(aggregatedPubKey).slice(0, 40) + "...",
);

// Aggregate 2 public keys
const aggPub12 = Bls12381.aggregatePublicKeys([pub1, pub2]);
console.log("2 pubkeys aggregated:", aggPub12.length, "bytes");

// Aggregation is associative: (a + b) + c = a + (b + c)
const aggPub12Then3 = Bls12381.aggregatePublicKeys([aggPub12, pub3]);
console.log("Step-wise aggregation:", aggPub12Then3.length, "bytes");

// Aggregate many public keys
const manyPubKeys = Array.from({ length: 50 }, () => {
	const sk = Bls12381.randomPrivateKey();
	return Bls12381.derivePublicKey(sk);
});
const manyAggregated = Bls12381.aggregatePublicKeys(manyPubKeys);
console.log("50 pubkeys aggregated:", manyAggregated.length, "bytes");
console.log("Compression: 50x96 =", 50 * 96, "bytes -> 96 bytes");

// Use case: pre-compute committee aggregate
// Beacon chain committees have their aggregate pubkey pre-computed
console.log("\nCommittee aggregate use case:");
const committeeSize = 128;
const committeePubKeys = Array.from({ length: committeeSize }, () => {
	const sk = Bls12381.randomPrivateKey();
	return Bls12381.derivePublicKey(sk);
});
const committeeAggregate = Bls12381.aggregatePublicKeys(committeePubKeys);
console.log(
	`Committee of ${committeeSize} validators: ${committeeAggregate.length} bytes`,
);
