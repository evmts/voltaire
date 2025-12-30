import { Bls12381, Hex } from "@tevm/voltaire";
// Verify BLS12-381 signatures

// Generate keypair and sign
const privateKey = Bls12381.randomPrivateKey();
const publicKey = Bls12381.derivePublicKey(privateKey);

const message = new TextEncoder().encode("Verify this attestation");
const signature = Bls12381.sign(message, privateKey);

// Verify valid signature
const isValid = Bls12381.verify(signature, message, publicKey);

// Try with wrong public key
const wrongPrivateKey = Bls12381.randomPrivateKey();
const wrongPublicKey = Bls12381.derivePublicKey(wrongPrivateKey);
const wrongKeyResult = Bls12381.verify(signature, message, wrongPublicKey);

// Try with wrong message
const wrongMessage = new TextEncoder().encode("Different message");
const wrongMsgResult = Bls12381.verify(signature, wrongMessage, publicKey);

// Try with corrupted signature
const corruptedSig = new Uint8Array(signature);
corruptedSig[0] ^= 0xff; // flip bits
const corruptedResult = Bls12381.verify(corruptedSig, message, publicKey);

// Verify empty message signature
const emptyMessage = new Uint8Array(0);
const emptySig = Bls12381.sign(emptyMessage, privateKey);
const emptyValid = Bls12381.verify(emptySig, emptyMessage, publicKey);

// Cross-verify: Alice signs, Bob verifies
const alicePrivate = Bls12381.randomPrivateKey();
const alicePublic = Bls12381.derivePublicKey(alicePrivate);
const aliceMsg = new TextEncoder().encode("Alice's attestation");
const aliceSig = Bls12381.sign(aliceMsg, alicePrivate);

// Bob can verify with Alice's public key
const bobVerifies = Bls12381.verify(aliceSig, aliceMsg, alicePublic);
