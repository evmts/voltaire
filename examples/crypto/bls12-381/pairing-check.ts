import { bls12_381 } from '@noble/curves/bls12-381.js';

/**
 * BLS12-381 Pairing Check
 *
 * Demonstrates the bilinear pairing operation:
 * - Single pairing computation
 * - Multi-pairing checks
 * - Pairing properties (bilinearity, non-degeneracy)
 * - Usage in signature verification
 */

console.log('=== BLS12-381 Pairing Check ===\n');

// 1. Basic Pairing Computation
console.log('1. Basic Pairing Computation');
console.log('-'.repeat(50));

const g1Gen = bls12_381.G1.Point.BASE;
const g2Gen = bls12_381.G2.Point.BASE;

// Compute e(G1, G2)
const pairing1 = bls12_381.pairing(g1Gen, g2Gen);

console.log('e(G1_gen, G2_gen) computed');
console.log('Result is in GT (Fp12 subgroup)');
console.log('Result (first 32 hex digits):', pairing1.toString().slice(0, 32), '...\n');

// 2. Pairing Bilinearity
console.log('2. Bilinearity Property');
console.log('-'.repeat(50));

const a = 5n;
const b = 7n;

// e(a*G1, b*G2) should equal e(G1, G2)^(ab)
const lhs = bls12_381.pairing(g1Gen.multiply(a), g2Gen.multiply(b));
const rhs = bls12_381.fields.Fp12.pow(pairing1, a * b);

console.log('a =', a, ', b =', b);
console.log('Testing: e(a*G1, b*G2) = e(G1, G2)^(ab)');
console.log('Left side:', lhs.toString().slice(0, 32), '...');
console.log('Right side:', rhs.toString().slice(0, 32), '...');
console.log('Bilinearity holds:', lhs.equals(rhs), '\n');

// 3. Pairing Product Check
console.log('3. Multi-Pairing Product Check');
console.log('-'.repeat(50));

// Check if e(P1, Q1) * e(P2, Q2) = 1
// Equivalent to: e(P1, Q1) = e(-P2, Q2)

const p1 = g1Gen.multiply(3n);
const q1 = g2Gen.multiply(4n);
const p2 = g1Gen.multiply(4n);
const q2 = g2Gen.multiply(3n);

// e(3*G1, 4*G2) * e(4*G1, 3*G2) should equal e(G1, G2)^(3*4 + 4*3) = e(G1, G2)^24
const product = bls12_381.fields.Fp12.mul(
  bls12_381.pairing(p1, q1),
  bls12_381.pairing(p2, q2)
);
const expected = bls12_381.fields.Fp12.pow(pairing1, 24n);

console.log('P1 = 3*G1, Q1 = 4*G2');
console.log('P2 = 4*G1, Q2 = 3*G2');
console.log('e(P1,Q1) * e(P2,Q2) = e(G1,G2)^24');
console.log('Product check passed:', product.equals(expected), '\n');

// 4. Signature Verification Pattern
console.log('4. BLS Signature Verification Pattern');
console.log('-'.repeat(50));

// Simulate: signature = privkey * H(msg), pubkey = privkey * G2
const privateKey = 42n;
const messageHash = g1Gen.multiply(100n); // Simulated H(msg)
const signature = messageHash.multiply(privateKey);
const publicKey = g2Gen.multiply(privateKey);

// Verify: e(sig, G2) = e(H(msg), pubkey)
// Or equivalently: e(sig, G2) * e(-H(msg), pubkey) = 1
const lhsVerify = bls12_381.pairing(signature, g2Gen);
const rhsVerify = bls12_381.pairing(messageHash, publicKey);

console.log('Private key:', privateKey);
console.log('Signature = privkey * H(msg)');
console.log('Public key = privkey * G2');
console.log('\nVerification equation: e(sig, G2) = e(H(msg), pubkey)');
console.log('Signature valid:', lhsVerify.equals(rhsVerify), '\n');

// 5. Pairing Check for Aggregate Signatures
console.log('5. Aggregate Signature Verification');
console.log('-'.repeat(50));

// Three validators sign the same message
const privKeys = [11n, 22n, 33n];
const message = g1Gen.multiply(999n);

// Each validator creates signature and public key
const signatures = privKeys.map(pk => message.multiply(pk));
const pubKeys = privKeys.map(pk => g2Gen.multiply(pk));

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

console.log('Number of validators:', privKeys.length);
console.log('Each signs same message');
console.log('Signatures aggregated: 3 sigs -> 1 sig');
console.log('Public keys aggregated: 3 keys -> 1 key');
console.log('Aggregate verification passed:', aggLhs.equals(aggRhs), '\n');

// 6. Batch Verification (Different Messages)
console.log('6. Batch Verification (Different Messages)');
console.log('-'.repeat(50));

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

console.log('Number of signatures:', sigs.length);
console.log('Each validator signs different message');
console.log('Batch verification requires', messages.length + 1, 'pairings');
console.log('vs', messages.length * 2, 'pairings for individual verification');
console.log('Batch verification passed:', batchLhs.equals(batchRhs), '\n');

// 7. Non-degeneracy
console.log('7. Non-degeneracy Property');
console.log('-'.repeat(50));

// e(G1, G2) should not equal 1 (identity in GT)
const one = bls12_381.fields.Fp12.ONE;
const notDegenerate = !pairing1.equals(one);

console.log('e(G1, G2) ≠ 1 (identity in GT)');
console.log('Non-degeneracy holds:', notDegenerate, '\n');

// 8. Pairing with Identity
console.log('8. Pairing with Identity Points');
console.log('-'.repeat(50));

const g1Zero = bls12_381.G1.Point.ZERO;
const g2Zero = bls12_381.G2.Point.ZERO;

// e(0, Q) = 1 for any Q
const pairingZeroG1 = bls12_381.pairing(g1Zero, g2Gen);
console.log('e(0_G1, G2) = 1:', pairingZeroG1.equals(one));

// e(P, 0) = 1 for any P
const pairingZeroG2 = bls12_381.pairing(g1Gen, g2Zero);
console.log('e(G1, 0_G2) = 1:', pairingZeroG2.equals(one), '\n');

console.log('=== Complete ===');
