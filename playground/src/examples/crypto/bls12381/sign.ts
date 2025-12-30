import { Bls12381, Hex } from "@tevm/voltaire";
// Sign messages with BLS12-381

// Generate keypair
const privateKey = Bls12381.randomPrivateKey();
const publicKey = Bls12381.derivePublicKey(privateKey);

// Sign a message (message is hashed to G1 curve point internally)
const message = new TextEncoder().encode("Hello, Ethereum!");
const signature = Bls12381.sign(message, privateKey);

console.log("Message:", new TextDecoder().decode(message));
console.log("Signature:", Hex.fromBytes(signature));
console.log(
	"Signature length:",
	signature.length,
	"bytes (G1 point compressed)",
);

// Sign empty message
const emptyMessage = new Uint8Array(0);
const emptySig = Bls12381.sign(emptyMessage, privateKey);
console.log("Empty message signature length:", emptySig.length, "bytes");

// Sign binary data
const binaryData = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
const binarySig = Bls12381.sign(binaryData, privateKey);
console.log("Binary data signature length:", binarySig.length, "bytes");

// Sign large message
const largeMessage = new Uint8Array(10000).fill(0x42);
const largeSig = Bls12381.sign(largeMessage, privateKey);
console.log("Large message signature length:", largeSig.length, "bytes");

// Same message, same key = same signature (deterministic)
const sig1 = Bls12381.sign(message, privateKey);
const sig2 = Bls12381.sign(message, privateKey);
const sigsMatch = Hex.fromBytes(sig1) === Hex.fromBytes(sig2);
console.log("Signatures deterministic:", sigsMatch);

// Different messages = different signatures
const msg1 = new TextEncoder().encode("Message 1");
const msg2 = new TextEncoder().encode("Message 2");
const sigA = Bls12381.sign(msg1, privateKey);
const sigB = Bls12381.sign(msg2, privateKey);
const sigsDiffer = Hex.fromBytes(sigA) !== Hex.fromBytes(sigB);
console.log("Different messages, different sigs:", sigsDiffer);
