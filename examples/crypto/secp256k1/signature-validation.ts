/**
 * Signature validation and edge cases
 *
 * Demonstrates:
 * - Signature component validation
 * - Low-s malleability protection
 * - Invalid signature detection
 * - Edge case handling
 * - Security best practices
 */

import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import { keccak256 } from "../../../src/primitives/Hash/BrandedHash/keccak256.js";

console.log("=== Signature Validation ===\n");

// Generate test keypair
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Create valid signature
const message = "Test message";
const messageBytes = new TextEncoder().encode(message);
const messageHash = keccak256(messageBytes);
const validSignature = Secp256k1.sign(messageHash, privateKey);

console.log("1. Valid Signature");
console.log("   Message:", message);
console.log(
	"   r:",
	Buffer.from(validSignature.r).toString("hex").slice(0, 16) + "...",
);
console.log(
	"   s:",
	Buffer.from(validSignature.s).toString("hex").slice(0, 16) + "...",
);
console.log("   v:", validSignature.v);

// Validate signature structure
const isValid = Secp256k1.isValidSignature(validSignature);
console.log("   Valid structure:", isValid ? "✓ Yes" : "✗ No");

// Verify signature
const verifies = Secp256k1.verify(validSignature, messageHash, publicKey);
console.log("   Verifies:", verifies ? "✓ Yes" : "✗ No");

// 2. Invalid r component (all zeros)
console.log("\n2. Invalid r Component (r = 0)");
const invalidR = {
	r: new Uint8Array(32), // All zeros
	s: validSignature.s,
	v: validSignature.v,
};

const rIsValid = Secp256k1.isValidSignature(invalidR);
console.log("   Valid structure:", rIsValid ? "✓ Yes" : "✗ No (expected)");

try {
	const rVerifies = Secp256k1.verify(invalidR, messageHash, publicKey);
	console.log("   Verifies:", rVerifies ? "✓ Yes" : "✗ No (expected)");
} catch (error) {
	console.log(
		"   Error:",
		error instanceof Error ? error.message : String(error),
	);
}

// 3. Invalid s component (too large)
console.log("\n3. Invalid s Component (s >= n)");
const invalidS = {
	r: validSignature.r,
	s: new Uint8Array(32).fill(0xff), // All 0xFF > curve order
	v: validSignature.v,
};

const sIsValid = Secp256k1.isValidSignature(invalidS);
console.log("   Valid structure:", sIsValid ? "✓ Yes" : "✗ No (expected)");

try {
	const sVerifies = Secp256k1.verify(invalidS, messageHash, publicKey);
	console.log("   Verifies:", sVerifies ? "✓ Yes" : "✗ No (expected)");
} catch (error) {
	console.log(
		"   Error:",
		error instanceof Error ? error.message : String(error),
	);
}

// 4. Wrong signature length
console.log("\n4. Wrong Signature Length");
const wrongLengthR = {
	r: new Uint8Array(16), // Too short
	s: validSignature.s,
	v: validSignature.v,
};

try {
	const lengthVerifies = Secp256k1.verify(wrongLengthR, messageHash, publicKey);
	console.log("   Verifies:", lengthVerifies ? "✓ Yes" : "✗ No (expected)");
} catch (error) {
	console.log("   Error: Signature component wrong length (expected)");
}

// 5. Low-s malleability check
console.log("\n5. Low-s Malleability Protection");

const CURVE_ORDER = BigInt(
	"0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
);

// Convert s to BigInt
const sValue = BigInt("0x" + Buffer.from(validSignature.s).toString("hex"));
const halfOrder = CURVE_ORDER / 2n;

console.log("   Signature s value: 0x" + sValue.toString(16));
console.log("   Half curve order:  0x" + halfOrder.toString(16));
console.log(
	"   s <= n/2:",
	sValue <= halfOrder ? "✓ Yes (low-s)" : "✗ No (high-s)",
);

// All signatures from sign() should be low-s
console.log("   Auto-normalized:", "✓ Yes (RFC 6979 + low-s enforcement)");

// 6. Private key validation
console.log("\n6. Private Key Validation");

// Valid key
const validKey = new Uint8Array(32);
validKey[31] = 42;
console.log(
	"   Valid key (42):",
	Secp256k1.isValidPrivateKey(validKey) ? "✓ Yes" : "✗ No",
);

// Zero key (invalid)
const zeroKey = new Uint8Array(32);
console.log(
	"   Zero key:",
	Secp256k1.isValidPrivateKey(zeroKey) ? "✓ Yes" : "✗ No (expected)",
);

// Key >= n (invalid)
const tooLargeKey = new Uint8Array([
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xff,
	0xfe,
	0xba,
	0xae,
	0xdc,
	0xe6,
	0xaf,
	0x48,
	0xa0,
	0x3b,
	0xbf,
	0xd2,
	0x5e,
	0x8c,
	0xd0,
	0x36,
	0x41,
	0x41, // n (curve order) - invalid
]);
console.log(
	"   Key >= n:",
	Secp256k1.isValidPrivateKey(tooLargeKey) ? "✓ Yes" : "✗ No (expected)",
);

// 7. Public key validation
console.log("\n7. Public Key Validation");

// Valid key (derived)
console.log(
	"   Valid derived key:",
	Secp256k1.isValidPublicKey(publicKey) ? "✓ Yes" : "✗ No",
);

// Random bytes (likely not on curve)
const randomBytes = new Uint8Array(64);
crypto.getRandomValues(randomBytes);
console.log(
	"   Random bytes:",
	Secp256k1.isValidPublicKey(randomBytes) ? "✓ Yes" : "✗ No (expected)",
);

// Wrong length
const wrongLength = new Uint8Array(32);
console.log(
	"   Wrong length (32):",
	Secp256k1.isValidPublicKey(wrongLength) ? "✓ Yes" : "✗ No (expected)",
);

// 8. Security recommendations
console.log("\n8. Security Recommendations");
console.log("   ✓ Always validate signatures before use");
console.log("   ✓ Check signature components (r, s) are in valid range");
console.log("   ✓ Verify low-s to prevent malleability");
console.log("   ✓ Validate public keys are on the curve");
console.log("   ✓ Never reuse nonces (use RFC 6979)");
console.log("   ✓ Use constant-time implementations");
console.log("   ✓ Protect private keys with hardware security");
