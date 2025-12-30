import { Bls12381, Hex } from "@tevm/voltaire";

// BLS12-381 - Beacon Chain signatures with aggregation

// Generate random private key (32 bytes, < curve order)
const privateKey = Bls12381.randomPrivateKey();

// Derive public key (G1 point, 48 bytes compressed)
const publicKey = Bls12381.derivePublicKey(privateKey);

// Sign a message (produces G2 point, 96 bytes)
const message = new TextEncoder().encode("Hello, Beacon Chain!");
const signature = Bls12381.sign(message, privateKey);

// Verify signature
const isValid = Bls12381.verify(signature, message, publicKey);

// Generate multiple keypairs for aggregation
const pk1 = Bls12381.randomPrivateKey();
const pk2 = Bls12381.randomPrivateKey();
const pk3 = Bls12381.randomPrivateKey();

const pub1 = Bls12381.derivePublicKey(pk1);
const pub2 = Bls12381.derivePublicKey(pk2);
const pub3 = Bls12381.derivePublicKey(pk3);

// Sign same message with multiple keys
const sig1 = Bls12381.sign(message, pk1);
const sig2 = Bls12381.sign(message, pk2);
const sig3 = Bls12381.sign(message, pk3);

// Aggregate signatures into single 96-byte signature
const aggregatedSig = Bls12381.aggregate([sig1, sig2, sig3]);

// Aggregate public keys
const aggregatedPubKey = Bls12381.aggregatePublicKeys([pub1, pub2, pub3]);

// Fast aggregate verify (all signed same message)
const fastVerify = Bls12381.fastAggregateVerify(aggregatedSig, message, [
	pub1,
	pub2,
	pub3,
]);

// Batch verify (different messages)
const msg1 = new TextEncoder().encode("Message 1");
const msg2 = new TextEncoder().encode("Message 2");
const batchSig1 = Bls12381.sign(msg1, pk1);
const batchSig2 = Bls12381.sign(msg2, pk2);
const batchValid = Bls12381.batchVerify(
	[batchSig1, batchSig2],
	[msg1, msg2],
	[pub1, pub2],
);

// Validate private key
const keyValid = Bls12381.isValidPrivateKey(privateKey);
