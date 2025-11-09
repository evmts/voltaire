import { randomBytes } from "node:crypto";
import { bls12_381 } from "@noble/curves/bls12-381.js";

// Generate random 32-byte private key
const privateKey1 =
	BigInt(`0x${randomBytes(32).toString("hex")}`) % bls12_381.fields.Fr.ORDER;
const privateKey2 = 42n; // Use small key for demonstrative purposes

// Derive public keys: pubkey = privkey * G2
const publicKey1 = bls12_381.G2.Point.BASE.multiply(privateKey1);
const publicKey2 = bls12_381.G2.Point.BASE.multiply(privateKey2);

// Serialize public keys
const pubKeyBytes1 = publicKey1.toRawBytes(true); // Compressed
const pubKeyBytes2 = publicKey2.toRawBytes(true);

const message = new TextEncoder().encode("Hello, Ethereum!");

// Hash message to G1 point (this is what BLS signatures sign)
// In production, use proper hash_to_curve with domain separation
const messageHash = bls12_381.G1.hashToCurve(message, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});

// Sign: signature = privkey * H(message)
const signature1 = messageHash.multiply(privateKey1);
const signature2 = messageHash.multiply(privateKey2);

// Serialize signatures (G1 points)
const sigBytes1 = signature1.toRawBytes(true); // Compressed: 48 bytes
const sigBytes2 = signature2.toRawBytes(true);

// Verify: e(signature, G2_gen) = e(H(message), pubkey)
const g2Gen = bls12_381.G2.Point.BASE;

const lhs1 = bls12_381.pairing(signature1, g2Gen);
const rhs1 = bls12_381.pairing(messageHash, publicKey1);
const valid1 = lhs1.equals(rhs1);

const lhs2 = bls12_381.pairing(signature2, g2Gen);
const rhs2 = bls12_381.pairing(messageHash, publicKey2);
const valid2 = lhs2.equals(rhs2);

// Try to verify signature1 with publicKey2 (should fail)
const wrongLhs = bls12_381.pairing(signature1, g2Gen);
const wrongRhs = bls12_381.pairing(messageHash, publicKey2);
const wrongValid = wrongLhs.equals(wrongRhs);

// Modify signature slightly (should fail)
const corruptedSig = signature1.add(bls12_381.G1.Point.BASE);
const corruptedLhs = bls12_381.pairing(corruptedSig, g2Gen);
const corruptedValid = corruptedLhs.equals(rhs1);

// Same message + key always produces same signature
const message2 = new TextEncoder().encode("Hello, Ethereum!");
const messageHash2 = bls12_381.G1.hashToCurve(message2, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});
const signature2Again = messageHash2.multiply(privateKey2);

const message3 = new TextEncoder().encode("Hello, World!");
const messageHash3 = bls12_381.G1.hashToCurve(message3, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});
const signature3 = messageHash3.multiply(privateKey2);

// Different DSTs prevent cross-protocol attacks
const dstBeacon = "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_BEACON_BLOCK_";
const dstAttest = "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_ATTESTATION_";

const hashBeacon = bls12_381.G1.hashToCurve(message, { DST: dstBeacon });
const hashAttest = bls12_381.G1.hashToCurve(message, { DST: dstAttest });

// Helper function for complete workflow
function signMessage(
	privKey: bigint,
	msg: Uint8Array,
): {
	signature: typeof bls12_381.G1.Point.BASE;
	publicKey: typeof bls12_381.G2.Point.BASE;
} {
	const msgHash = bls12_381.G1.hashToCurve(msg, {
		DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
	});
	return {
		signature: msgHash.multiply(privKey),
		publicKey: bls12_381.G2.Point.BASE.multiply(privKey),
	};
}

function verifySignature(
	signature: typeof bls12_381.G1.Point.BASE,
	publicKey: typeof bls12_381.G2.Point.BASE,
	msg: Uint8Array,
): boolean {
	const msgHash = bls12_381.G1.hashToCurve(msg, {
		DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
	});
	const lhs = bls12_381.pairing(signature, bls12_381.G2.Point.BASE);
	const rhs = bls12_381.pairing(msgHash, publicKey);
	return lhs.equals(rhs);
}

const testPrivKey = 12345n;
const testMessage = new TextEncoder().encode("Test workflow");

const { signature: testSig, publicKey: testPubKey } = signMessage(
	testPrivKey,
	testMessage,
);
const testValid = verifySignature(testSig, testPubKey, testMessage);
