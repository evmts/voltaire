import { Hex, X25519 } from "@tevm/voltaire";
// Multi-party key exchange scenarios

const alice = X25519.generateKeypair();
const bob = X25519.generateKeypair();
const charlie = X25519.generateKeypair();

const aliceBob = X25519.scalarmult(alice.secretKey, bob.publicKey);
const bobAlice = X25519.scalarmult(bob.secretKey, alice.publicKey);

const aliceCharlie = X25519.scalarmult(alice.secretKey, charlie.publicKey);
const charlieAlice = X25519.scalarmult(charlie.secretKey, alice.publicKey);

const bobCharlie = X25519.scalarmult(bob.secretKey, charlie.publicKey);
const charlieBob = X25519.scalarmult(charlie.secretKey, bob.publicKey);
const ab_ne_ac = !aliceBob.every((byte, i) => byte === aliceCharlie[i]);
const ab_ne_bc = !aliceBob.every((byte, i) => byte === bobCharlie[i]);
const ac_ne_bc = !aliceCharlie.every((byte, i) => byte === bobCharlie[i]);
