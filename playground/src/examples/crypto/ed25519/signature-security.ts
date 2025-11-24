// Ed25519 signature security edge cases
import * as Ed25519 from "../../../crypto/Ed25519/index.js";

// Generate valid keypair
const seed = new Uint8Array(32).fill(1);
const keypair = Ed25519.keypairFromSeed(seed);
const message = new TextEncoder().encode("test");
const signature = Ed25519.sign(message, keypair.secretKey);
const zeroSignature = new Uint8Array(64);
const onesSignature = new Uint8Array(64).fill(0xff);
const identityPoint = new Uint8Array(32);
identityPoint[0] = 0x01;

// Corrupt R component (first 32 bytes)
const corruptedR = new Uint8Array(signature);
for (let i = 0; i < 32; i++) {
	corruptedR[i] ^= 1;
}

// Corrupt S component (last 32 bytes)
const corruptedS = new Uint8Array(signature);
for (let i = 32; i < 64; i++) {
	corruptedS[i] ^= 1;
}

// Swap R and S components
const swappedSig = new Uint8Array(64);
swappedSig.set(signature.slice(32, 64), 0);
swappedSig.set(signature.slice(0, 32), 32);
const invalidS = new Uint8Array(64);
invalidS.set(signature.slice(0, 32), 0);
for (let i = 32; i < 64; i++) {
	invalidS[i] = 0xff;
}
const testPositions = [0, 1, 15, 16, 31, 32, 47, 48, 63];
let allRejected = true;
for (const pos of testPositions) {
	const flipped = new Uint8Array(signature);
	flipped[pos] ^= 0xff;
	if (Ed25519.verify(flipped, message, keypair.publicKey)) {
		allRejected = false;
		break;
	}
}
const largeMessage = new Uint8Array(1024 * 1024).fill(0x42);
const largeSignature = Ed25519.sign(largeMessage, keypair.secretKey);
