/**
 * Benchmark: BLS12-381 Elliptic Curve Cryptography
 * Compares performance of BLS12-381 operations (G1, G2, Pairing, Signatures)
 */

import { bls12_381 } from "@noble/curves/bls12-381.js";
import { bench, run } from "mitata";
import { Bls12381 } from "./index.js";

// Noble BLS12-381 shortSignatures API (the standard BLS API)
const nobleBls = bls12_381.shortSignatures;

// ============================================================================
// Test Data Setup
// ============================================================================

// Generate test keys
const privateKey1 = Bls12381.randomPrivateKey();
const privateKey2 = Bls12381.randomPrivateKey();
const publicKey1 = Bls12381.derivePublicKey(privateKey1);
const publicKey2 = Bls12381.derivePublicKey(privateKey2);

const message = new TextEncoder().encode("Hello, Ethereum Consensus!");
const _message2 = new TextEncoder().encode("Different message for testing");

// Pre-compute signatures for verification benchmarks
const signature1 = Bls12381.sign(message, privateKey1);
const signature2 = Bls12381.sign(message, privateKey2);
const aggregatedSig = Bls12381.aggregate([signature1, signature2]);

// G1/G2 points for low-level operations
const g1Gen = Bls12381.G1.generator();
const g2Gen = Bls12381.G2.generator();
const scalar = 123456789n;

const g1Point = Bls12381.G1.mul(g1Gen, scalar);
const g1Point2 = Bls12381.G1.mul(g1Gen, scalar + 1n);
const g2Point = Bls12381.G2.mul(g2Gen, scalar);
const g2Point2 = Bls12381.G2.mul(g2Gen, scalar + 1n);

// Noble test data for comparison
const noblePrivKey = bls12_381.utils.randomSecretKey();
const noblePubKey = nobleBls.getPublicKey(noblePrivKey);
// Noble requires: hash message first, then sign the hash point
const nobleMsgHash = nobleBls.hash(message);
const nobleSig = nobleBls.sign(nobleMsgHash, noblePrivKey);

// ============================================================================
// Key Generation & Derivation
// ============================================================================

bench("randomPrivateKey - Voltaire", () => {
	Bls12381.randomPrivateKey();
});

bench("randomPrivateKey - Noble", () => {
	bls12_381.utils.randomSecretKey();
});

await run();

bench("derivePublicKey - Voltaire", () => {
	Bls12381.derivePublicKey(privateKey1);
});

bench("getPublicKey - Noble", () => {
	nobleBls.getPublicKey(noblePrivKey);
});

await run();

// ============================================================================
// Signing
// ============================================================================

bench("sign - Voltaire", () => {
	Bls12381.sign(message, privateKey1);
});

// Noble requires hash first, then sign
bench("sign (hash+sign) - Noble", () => {
	const hash = nobleBls.hash(message);
	nobleBls.sign(hash, noblePrivKey);
});

await run();

// ============================================================================
// Verification
// ============================================================================

bench("verify - Voltaire", () => {
	Bls12381.verify(signature1, message, publicKey1);
});

// Noble requires hash first, then verify
bench("verify (hash+verify) - Noble", () => {
	const hash = nobleBls.hash(message);
	nobleBls.verify(nobleSig, hash, noblePubKey);
});

await run();

// ============================================================================
// Aggregation
// ============================================================================

bench("aggregate - 2 sigs - Voltaire", () => {
	Bls12381.aggregate([signature1, signature2]);
});

bench("aggregateSignatures - 2 sigs - Noble", () => {
	nobleBls.aggregateSignatures([nobleSig, nobleSig]);
});

await run();

// Generate more signatures for batch tests
const sigs5 = [signature1, signature2, signature1, signature2, signature1];
const sigs10 = [...sigs5, ...sigs5];

bench("aggregate - 5 sigs - Voltaire", () => {
	Bls12381.aggregate(sigs5);
});

bench("aggregate - 10 sigs - Voltaire", () => {
	Bls12381.aggregate(sigs10);
});

await run();

bench("aggregatePublicKeys - 2 keys - Voltaire", () => {
	Bls12381.aggregatePublicKeys([publicKey1, publicKey2]);
});

bench("aggregatePublicKeys - 2 keys - Noble", () => {
	nobleBls.aggregatePublicKeys([noblePubKey, noblePubKey]);
});

await run();

// ============================================================================
// Aggregate Verification
// ============================================================================

bench("aggregateVerify - 2 pairs - Voltaire", () => {
	Bls12381.aggregateVerify(aggregatedSig, message, [publicKey1, publicKey2]);
});

await run();

bench("fastAggregateVerify - 2 keys - Voltaire", () => {
	Bls12381.fastAggregateVerify(aggregatedSig, message, [
		publicKey1,
		publicKey2,
	]);
});

await run();

// ============================================================================
// G1 Operations
// ============================================================================

bench("G1.generator - Voltaire", () => {
	Bls12381.G1.generator();
});

await run();

bench("G1.add - Voltaire", () => {
	Bls12381.G1.add(g1Point, g1Point2);
});

await run();

bench("G1.double - Voltaire", () => {
	Bls12381.G1.double(g1Point);
});

await run();

bench("G1.mul - small scalar - Voltaire", () => {
	Bls12381.G1.mul(g1Gen, 12345n);
});

bench("G1.mul - large scalar - Voltaire", () => {
	Bls12381.G1.mul(g1Gen, scalar);
});

await run();

bench("G1.negate - Voltaire", () => {
	Bls12381.G1.negate(g1Point);
});

await run();

bench("G1.isOnCurve - Voltaire", () => {
	Bls12381.G1.isOnCurve(g1Point);
});

await run();

bench("G1.equal - Voltaire", () => {
	Bls12381.G1.equal(g1Point, g1Point2);
});

await run();

// ============================================================================
// G2 Operations
// ============================================================================

bench("G2.generator - Voltaire", () => {
	Bls12381.G2.generator();
});

await run();

bench("G2.add - Voltaire", () => {
	Bls12381.G2.add(g2Point, g2Point2);
});

await run();

bench("G2.double - Voltaire", () => {
	Bls12381.G2.double(g2Point);
});

await run();

bench("G2.mul - small scalar - Voltaire", () => {
	Bls12381.G2.mul(g2Gen, 12345n);
});

bench("G2.mul - large scalar - Voltaire", () => {
	Bls12381.G2.mul(g2Gen, scalar);
});

await run();

bench("G2.negate - Voltaire", () => {
	Bls12381.G2.negate(g2Point);
});

await run();

bench("G2.isOnCurve - Voltaire", () => {
	Bls12381.G2.isOnCurve(g2Point);
});

await run();

// ============================================================================
// Pairing Operations
// ============================================================================

bench("Pairing.pair - Voltaire", () => {
	Bls12381.Pairing.pair(g1Point, g2Point);
});

await run();

bench("Pairing.pairingCheck - 2 pairs - Voltaire", () => {
	Bls12381.Pairing.pairingCheck([
		[g1Point, g2Point],
		[g1Point2, g2Point2],
	]);
});

await run();

// ============================================================================
// Field Operations (Fr)
// ============================================================================

const a = 12345678901234567890n;
const b = 98765432109876543210n;

bench("Fr.add - Voltaire", () => {
	Bls12381.Fr.add(a, b);
});

bench("Fr.sub - Voltaire", () => {
	Bls12381.Fr.sub(a, b);
});

bench("Fr.mul - Voltaire", () => {
	Bls12381.Fr.mul(a, b);
});

await run();

bench("Fr.inv - Voltaire", () => {
	Bls12381.Fr.inv(a);
});

bench("Fr.pow - Voltaire", () => {
	Bls12381.Fr.pow(a, 17n);
});

await run();
