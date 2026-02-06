import { Bls12381, Hex } from "@tevm/voltaire";
// BLS12-381 Overview - Beacon Chain pairing-friendly curve

// BLS12-381 is a pairing-friendly elliptic curve used in Ethereum's consensus layer.
// Key properties:
// - Signatures: G1 points (48 bytes compressed)
// - Public keys: G2 points (96 bytes compressed)
// - Supports signature aggregation: combine N signatures into 1
// - Pairing-based verification enables efficient batch verification

// Generate keypair
const privateKey = Bls12381.randomPrivateKey();
const publicKey = Bls12381.derivePublicKey(privateKey);

// Validate private key
const isValidKey = Bls12381.isValidPrivateKey(privateKey);

// Sign and verify
const message = new TextEncoder().encode("Hello, Beacon Chain!");
const signature = Bls12381.sign(message, privateKey);

const isValid = Bls12381.verify(signature, message, publicKey);

// Signature aggregation (main advantage of BLS)
const pk1 = Bls12381.randomPrivateKey();
const pk2 = Bls12381.randomPrivateKey();
const pub1 = Bls12381.derivePublicKey(pk1);
const pub2 = Bls12381.derivePublicKey(pk2);

const sig1 = Bls12381.sign(message, pk1);
const sig2 = Bls12381.sign(message, pk2);

// Aggregate: 2 signatures -> 1 signature (same size)
const aggSig = Bls12381.aggregate([sig1, sig2]);

// Aggregate public keys
const aggPubKey = Bls12381.aggregatePublicKeys([pub1, pub2]);

// Verify aggregated signature
const aggValid = Bls12381.fastAggregateVerify(aggSig, message, aggPubKey);
