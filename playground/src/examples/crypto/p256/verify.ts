import { Bytes, Hash, P256 } from "@tevm/voltaire";
// Generate keypair and sign a message
const privateKey = Bytes.random(32);
const publicKey = P256.derivePublicKey(privateKey);

const message = "Authenticate user session";
const messageHash = Hash.keccak256String(message);
const signature = P256.sign(messageHash, privateKey);
const isValid = P256.verify(signature, messageHash, publicKey);
const wrongHash = Hash.keccak256String("Different message");
const wrongMessage = P256.verify(signature, wrongHash, publicKey);
const otherPrivateKey = Bytes.random(32);
const otherPublicKey = P256.derivePublicKey(otherPrivateKey);
const wrongKey = P256.verify(signature, messageHash, otherPublicKey);
const corruptedSigR = {
	r: Bytes(signature.r),
	s: Bytes(signature.s),
};
if (corruptedSigR.r[0] !== undefined) {
	corruptedSigR.r[0] ^= 1; // Flip a bit
}
const corruptedR = P256.verify(corruptedSigR, messageHash, publicKey);
const corruptedSigS = {
	r: Bytes(signature.r),
	s: Bytes(signature.s),
};
if (corruptedSigS.s[31] !== undefined) {
	corruptedSigS.s[31] ^= 1; // Flip a bit
}
const corruptedS = P256.verify(corruptedSigS, messageHash, publicKey);
const zeroRSig = {
	r: Bytes.zero(32), // All zeros
	s: Bytes(Array(32).fill(1)),
};
const zeroR = P256.verify(zeroRSig, messageHash, publicKey);
const zeroSSig = {
	r: Bytes(Array(32).fill(1)),
	s: Bytes.zero(32), // All zeros
};
const zeroS = P256.verify(zeroSSig, messageHash, publicKey);
// Verify multiple signatures
const testMessages = ["msg1", "msg2", "msg3"];
let allValid = true;

for (const msg of testMessages) {
	const hash = Hash.keccak256String(msg);
	const sig = P256.sign(hash, privateKey);
	const valid = P256.verify(sig, hash, publicKey);
	allValid = allValid && valid;
}
