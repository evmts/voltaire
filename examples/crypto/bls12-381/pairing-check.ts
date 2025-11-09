import { bls12_381 } from "@noble/curves/bls12-381.js";

const g1Gen = bls12_381.G1.Point.BASE;
const g2Gen = bls12_381.G2.Point.BASE;

// Compute e(G1, G2)
const pairing1 = bls12_381.pairing(g1Gen, g2Gen);

const a = 5n;
const b = 7n;

// e(a*G1, b*G2) should equal e(G1, G2)^(ab)
const lhs = bls12_381.pairing(g1Gen.multiply(a), g2Gen.multiply(b));
const rhs = bls12_381.fields.Fp12.pow(pairing1, a * b);

// Check if e(P1, Q1) * e(P2, Q2) = 1
// Equivalent to: e(P1, Q1) = e(-P2, Q2)

const p1 = g1Gen.multiply(3n);
const q1 = g2Gen.multiply(4n);
const p2 = g1Gen.multiply(4n);
const q2 = g2Gen.multiply(3n);

// e(3*G1, 4*G2) * e(4*G1, 3*G2) should equal e(G1, G2)^(3*4 + 4*3) = e(G1, G2)^24
const product = bls12_381.fields.Fp12.mul(
	bls12_381.pairing(p1, q1),
	bls12_381.pairing(p2, q2),
);
const expected = bls12_381.fields.Fp12.pow(pairing1, 24n);

// Simulate: signature = privkey * H(msg), pubkey = privkey * G2
const privateKey = 42n;
const messageHash = g1Gen.multiply(100n); // Simulated H(msg)
const signature = messageHash.multiply(privateKey);
const publicKey = g2Gen.multiply(privateKey);

// Verify: e(sig, G2) = e(H(msg), pubkey)
// Or equivalently: e(sig, G2) * e(-H(msg), pubkey) = 1
const lhsVerify = bls12_381.pairing(signature, g2Gen);
const rhsVerify = bls12_381.pairing(messageHash, publicKey);

// Three validators sign the same message
const privKeys = [11n, 22n, 33n];
const message = g1Gen.multiply(999n);

// Each validator creates signature and public key
const signatures = privKeys.map((pk) => message.multiply(pk));
const pubKeys = privKeys.map((pk) => g2Gen.multiply(pk));

// Aggregate signatures by addition (same message)
let aggSig = signatures[0];
for (let i = 1; i < signatures.length; i++) {
	aggSig = aggSig.add(signatures[i]);
}

// Aggregate public keys
let aggPubKey = pubKeys[0];
for (let i = 1; i < pubKeys.length; i++) {
	aggPubKey = aggPubKey.add(pubKeys[i]);
}

// Verify aggregate: e(aggSig, G2) = e(msg, aggPubKey)
const aggLhs = bls12_381.pairing(aggSig, g2Gen);
const aggRhs = bls12_381.pairing(message, aggPubKey);

// Three validators sign different messages
const messages = [
	g1Gen.multiply(100n),
	g1Gen.multiply(200n),
	g1Gen.multiply(300n),
];
const sigs = messages.map((msg, i) => msg.multiply(privKeys[i]));

// Aggregate signatures
let batchSig = sigs[0];
for (let i = 1; i < sigs.length; i++) {
	batchSig = batchSig.add(sigs[i]);
}

// Multi-pairing check:
// e(sig1, G2) * e(sig2, G2) * e(sig3, G2) = e(msg1, pk1) * e(msg2, pk2) * e(msg3, pk3)
// Simplified: e(sig1+sig2+sig3, G2) = e(msg1, pk1) * e(msg2, pk2) * e(msg3, pk3)

const batchLhs = bls12_381.pairing(batchSig, g2Gen);

let batchRhs = bls12_381.pairing(messages[0], pubKeys[0]);
for (let i = 1; i < messages.length; i++) {
	const pairingI = bls12_381.pairing(messages[i], pubKeys[i]);
	batchRhs = bls12_381.fields.Fp12.mul(batchRhs, pairingI);
}

// e(G1, G2) should not equal 1 (identity in GT)
const one = bls12_381.fields.Fp12.ONE;
const notDegenerate = !pairing1.equals(one);

const g1Zero = bls12_381.G1.Point.ZERO;
const g2Zero = bls12_381.G2.Point.ZERO;

// e(0, Q) = 1 for any Q
const pairingZeroG1 = bls12_381.pairing(g1Zero, g2Gen);

// e(P, 0) = 1 for any P
const pairingZeroG2 = bls12_381.pairing(g1Gen, g2Zero);
