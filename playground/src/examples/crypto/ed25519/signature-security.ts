import { Bytes, Ed25519 } from "@tevm/voltaire";
// Ed25519 signature security edge cases

// Generate valid keypair
const seed = Bytes(Array(32).fill(1));
const keypair = Ed25519.keypairFromSeed(seed);
const message = new TextEncoder().encode("test");
const signature = Ed25519.sign(message, keypair.secretKey);
const zeroSignature = Bytes.zero(64);
const onesSignature = Bytes(Array(64).fill(0xff));
const identityPoint = Bytes([0x01, ...Array(31).fill(0)]);

// Corrupt R component (first 32 bytes)
const corruptedR = Bytes(signature);
for (let i = 0; i < 32; i++) {
	corruptedR[i] ^= 1;
}

// Corrupt S component (last 32 bytes)
const corruptedS = Bytes(signature);
for (let i = 32; i < 64; i++) {
	corruptedS[i] ^= 1;
}

// Swap R and S components
const swappedSig = Bytes.concat(signature.slice(32, 64), signature.slice(0, 32));
const invalidS = Bytes([...signature.slice(0, 32), ...Array(32).fill(0xff)]);
const testPositions = [0, 1, 15, 16, 31, 32, 47, 48, 63];
let allRejected = true;
for (const pos of testPositions) {
	const flipped = Bytes(signature);
	flipped[pos] ^= 0xff;
	if (Ed25519.verify(flipped, message, keypair.publicKey)) {
		allRejected = false;
		break;
	}
}
const largeMessage = Bytes(Array(1024 * 1024).fill(0x42));
const largeSignature = Ed25519.sign(largeMessage, keypair.secretKey);
