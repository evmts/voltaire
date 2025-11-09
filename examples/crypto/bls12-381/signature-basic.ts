import { bls12_381 } from "@noble/curves/bls12-381.js";
import { randomBytes } from "crypto";

/**
 * Basic BLS Signature Operations
 *
 * Demonstrates complete BLS signature workflow:
 * - Key generation (private/public key pairs)
 * - Message signing
 * - Signature verification
 * - Hash-to-curve for messages
 * - Deterministic signatures
 */

console.log("=== Basic BLS Signature Operations ===\n");

// 1. Key Generation
console.log("1. Key Generation");
console.log("-".repeat(50));

// Generate random 32-byte private key
const privateKey1 =
	BigInt("0x" + randomBytes(32).toString("hex")) % bls12_381.fields.Fr.ORDER;
const privateKey2 = 42n; // Use small key for demonstrative purposes

// Derive public keys: pubkey = privkey * G2
const publicKey1 = bls12_381.G2.Point.BASE.multiply(privateKey1);
const publicKey2 = bls12_381.G2.Point.BASE.multiply(privateKey2);

console.log("Private key 1:", privateKey1.toString(16).slice(0, 16), "...");
console.log(
	"Public key 1 (x.c0):",
	publicKey1.toAffine().x.c0.toString(16).slice(0, 16),
	"...",
);
console.log("\nPrivate key 2:", privateKey2);
console.log(
	"Public key 2 (x.c0):",
	publicKey2.toAffine().x.c0.toString(16).slice(0, 16),
	"...",
);

// Serialize public keys
const pubKeyBytes1 = publicKey1.toRawBytes(true); // Compressed
const pubKeyBytes2 = publicKey2.toRawBytes(true);

console.log("\nPublic key compressed size:", pubKeyBytes1.length, "bytes");
console.log(
	"Public key 1 hex:",
	Buffer.from(pubKeyBytes1).toString("hex").slice(0, 32),
	"...\n",
);

// 2. Message Hashing (Hash-to-Curve)
console.log("2. Hash Message to G1 Curve Point");
console.log("-".repeat(50));

const message = new TextEncoder().encode("Hello, Ethereum!");

// Hash message to G1 point (this is what BLS signatures sign)
// In production, use proper hash_to_curve with domain separation
const messageHash = bls12_381.G1.hashToCurve(message, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});

console.log("Message:", new TextDecoder().decode(message));
console.log(
	"Hashed to G1 point (x):",
	messageHash.toAffine().x.toString(16).slice(0, 16),
	"...",
);
console.log("Hash-to-curve ensures uniform distribution on curve\n");

// 3. Signature Generation
console.log("3. Signature Generation");
console.log("-".repeat(50));

// Sign: signature = privkey * H(message)
const signature1 = messageHash.multiply(privateKey1);
const signature2 = messageHash.multiply(privateKey2);

console.log(
	"Signature 1 (x):",
	signature1.toAffine().x.toString(16).slice(0, 16),
	"...",
);
console.log(
	"Signature 2 (x):",
	signature2.toAffine().x.toString(16).slice(0, 16),
	"...",
);

// Serialize signatures (G1 points)
const sigBytes1 = signature1.toRawBytes(true); // Compressed: 48 bytes
const sigBytes2 = signature2.toRawBytes(true);

console.log("\nSignature compressed size:", sigBytes1.length, "bytes");
console.log(
	"Signature 1 hex:",
	Buffer.from(sigBytes1).toString("hex").slice(0, 32),
	"...\n",
);

// 4. Signature Verification
console.log("4. Signature Verification");
console.log("-".repeat(50));

// Verify: e(signature, G2_gen) = e(H(message), pubkey)
const g2Gen = bls12_381.G2.Point.BASE;

const lhs1 = bls12_381.pairing(signature1, g2Gen);
const rhs1 = bls12_381.pairing(messageHash, publicKey1);
const valid1 = lhs1.equals(rhs1);

const lhs2 = bls12_381.pairing(signature2, g2Gen);
const rhs2 = bls12_381.pairing(messageHash, publicKey2);
const valid2 = lhs2.equals(rhs2);

console.log("Signature 1 verification equation:");
console.log("  e(sig, G2) = e(H(msg), pubkey)");
console.log("  Valid:", valid1);

console.log("\nSignature 2 verification equation:");
console.log("  e(sig, G2) = e(H(msg), pubkey)");
console.log("  Valid:", valid2, "\n");

// 5. Invalid Signature Detection
console.log("5. Invalid Signature Detection");
console.log("-".repeat(50));

// Try to verify signature1 with publicKey2 (should fail)
const wrongLhs = bls12_381.pairing(signature1, g2Gen);
const wrongRhs = bls12_381.pairing(messageHash, publicKey2);
const wrongValid = wrongLhs.equals(wrongRhs);

console.log("Attempting to verify signature1 with publicKey2");
console.log("Should fail:", !wrongValid);

// Modify signature slightly (should fail)
const corruptedSig = signature1.add(bls12_381.G1.Point.BASE);
const corruptedLhs = bls12_381.pairing(corruptedSig, g2Gen);
const corruptedValid = corruptedLhs.equals(rhs1);

console.log("Attempting to verify corrupted signature");
console.log("Should fail:", !corruptedValid, "\n");

// 6. Deterministic Signatures
console.log("6. Deterministic Signatures");
console.log("-".repeat(50));

// Same message + key always produces same signature
const message2 = new TextEncoder().encode("Hello, Ethereum!");
const messageHash2 = bls12_381.G1.hashToCurve(message2, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});
const signature2Again = messageHash2.multiply(privateKey2);

console.log("Signing same message twice with same key");
console.log(
	"Signature 2 (first):",
	signature2.toAffine().x.toString(16).slice(0, 16),
	"...",
);
console.log(
	"Signature 2 (second):",
	signature2Again.toAffine().x.toString(16).slice(0, 16),
	"...",
);
console.log("Signatures identical:", signature2.equals(signature2Again), "\n");

// 7. Different Messages
console.log("7. Different Messages Produce Different Signatures");
console.log("-".repeat(50));

const message3 = new TextEncoder().encode("Hello, World!");
const messageHash3 = bls12_381.G1.hashToCurve(message3, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});
const signature3 = messageHash3.multiply(privateKey2);

console.log("Message A:", new TextDecoder().decode(message));
console.log("Message B:", new TextDecoder().decode(message3));
console.log(
	"\nSignature A (x):",
	signature2.toAffine().x.toString(16).slice(0, 16),
	"...",
);
console.log(
	"Signature B (x):",
	signature3.toAffine().x.toString(16).slice(0, 16),
	"...",
);
console.log("Signatures different:", !signature2.equals(signature3), "\n");

// 8. Domain Separation
console.log("8. Domain Separation Tags (DST)");
console.log("-".repeat(50));

// Different DSTs prevent cross-protocol attacks
const dstBeacon = "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_BEACON_BLOCK_";
const dstAttest = "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_ATTESTATION_";

const hashBeacon = bls12_381.G1.hashToCurve(message, { DST: dstBeacon });
const hashAttest = bls12_381.G1.hashToCurve(message, { DST: dstAttest });

console.log("Same message, different DSTs:");
console.log(
	"Beacon DST hash:",
	hashBeacon.toAffine().x.toString(16).slice(0, 16),
	"...",
);
console.log(
	"Attestation DST hash:",
	hashAttest.toAffine().x.toString(16).slice(0, 16),
	"...",
);
console.log("Hashes different:", !hashBeacon.equals(hashAttest));
console.log("\nDST prevents signature reuse across contexts\n");

// 9. Complete Workflow
console.log("9. Complete Signature Workflow");
console.log("-".repeat(50));

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

console.log("Test message:", new TextDecoder().decode(testMessage));
console.log("Signature created and verified:", testValid, "\n");

console.log("=== Complete ===");
