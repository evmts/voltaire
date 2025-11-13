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

// Generate test keypair
const privateKeyBytes = new Uint8Array(32);
crypto.getRandomValues(privateKeyBytes);
const privateKey = `0x${Buffer.from(privateKeyBytes).toString("hex")}`;
const publicKey = Secp256k1.derivePublicKey(privateKey as any);

// Create valid signature
const message = "Test message";
const messageBytes = new TextEncoder().encode(message);
const messageHash = keccak256(messageBytes);
const validSignature = Secp256k1.sign(messageHash, privateKey);

// Validate signature structure
const isValid = Secp256k1.isValidSignature(validSignature);

// Verify signature
const verifies = Secp256k1.verify(validSignature, messageHash, publicKey);
const invalidR = {
	r: new Uint8Array(32) as any, // All zeros
	s: validSignature.s,
	v: validSignature.v,
};

const rIsValid = Secp256k1.isValidSignature(invalidR);

try {
	const rVerifies = Secp256k1.verify(invalidR, messageHash, publicKey);
} catch (error) {}
const invalidS = {
	r: validSignature.r,
	s: new Uint8Array(32).fill(0xff) as any, // All 0xFF > curve order
	v: validSignature.v,
};

const sIsValid = Secp256k1.isValidSignature(invalidS);

try {
	const sVerifies = Secp256k1.verify(invalidS, messageHash, publicKey);
} catch (error) {}
const wrongLengthR = {
	r: new Uint8Array(16) as any, // Too short
	s: validSignature.s,
	v: validSignature.v,
};

try {
	const lengthVerifies = Secp256k1.verify(wrongLengthR, messageHash, publicKey);
} catch (error) {}

const CURVE_ORDER = BigInt(
	"0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
);

// Convert s to BigInt
const sValue = BigInt(`0x${Buffer.from(validSignature.s).toString("hex")}`);
const halfOrder = CURVE_ORDER / 2n;

// Valid key
const validKey = new Uint8Array(32);
validKey[31] = 42;

// Zero key (invalid)
const zeroKey = new Uint8Array(32);

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

// Random bytes (likely not on curve)
const randomBytes = new Uint8Array(64);
crypto.getRandomValues(randomBytes);

// Wrong length
const wrongLength = new Uint8Array(32);
